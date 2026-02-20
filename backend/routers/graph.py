"""
GET  /api/graph  — return the full graph
POST /api/graph  — upsert the full graph
"""
from fastapi import APIRouter, HTTPException
from database import get_pool
from models import GraphPayload, DeviceGraph, PortGraph, Connection

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("", response_model=GraphPayload)
async def get_graph():
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Devices with their type name
        device_rows = await conn.fetch("""
            SELECT d.id, d.type_id, dt.name AS type, d.name, d.description, d.pos_x, d.pos_y
            FROM devices d
            LEFT JOIN device_types dt ON dt.id = d.type_id
            ORDER BY d.id
        """)

        # All ports
        port_rows = await conn.fetch("""
            SELECT id, device_id, direction, name, port_order
            FROM ports
            ORDER BY device_id, port_order, id
        """)

        # All connections
        conn_rows = await conn.fetch("""
            SELECT id, source_port, target_port
            FROM connections
            ORDER BY id
        """)

    # Group ports by device
    ports_by_device: dict[int, list[PortGraph]] = {}
    for p in port_rows:
        ports_by_device.setdefault(p["device_id"], []).append(
            PortGraph(
                id=p["id"],
                direction=p["direction"],
                name=p["name"],
                port_order=p["port_order"],
            )
        )

    devices = [
        DeviceGraph(
            id=d["id"],
            type_id=d["type_id"],
            type=d["type"],
            name=d["name"],
            description=d["description"],
            pos_x=d["pos_x"] or 0.0,
            pos_y=d["pos_y"] or 0.0,
            ports=ports_by_device.get(d["id"], []),
        )
        for d in device_rows
    ]

    connections = [
        Connection(id=c["id"], source_port=c["source_port"], target_port=c["target_port"])
        for c in conn_rows
    ]

    return GraphPayload(devices=devices, connections=connections)


@router.post("", response_model=GraphPayload)
async def save_graph(payload: GraphPayload):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Collect IDs present in the payload
            incoming_device_ids = {d.id for d in payload.devices if d.id > 0}
            incoming_port_ids: set[int] = set()
            for device in payload.devices:
                for port in device.ports:
                    if port.id > 0:
                        incoming_port_ids.add(port.id)
            incoming_conn_ids = {c.id for c in payload.connections if c.id > 0}

            # ── Delete removed items (preserve cascade order) ──────────────────
            existing_devices = {r["id"] for r in await conn.fetch("SELECT id FROM devices")}
            for dev_id in existing_devices - incoming_device_ids:
                await conn.execute("DELETE FROM devices WHERE id = $1", dev_id)

            existing_conns = {r["id"] for r in await conn.fetch("SELECT id FROM connections")}
            for c_id in existing_conns - incoming_conn_ids:
                await conn.execute("DELETE FROM connections WHERE id = $1", c_id)

            # ── Upsert devices ─────────────────────────────────────────────────
            device_id_map: dict[int, int] = {}   # temp_id → real db id
            for d in payload.devices:
                if d.id > 0:
                    await conn.execute("""
                        INSERT INTO devices (id, type_id, name, description, pos_x, pos_y)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT (id) DO UPDATE SET
                            type_id     = EXCLUDED.type_id,
                            name        = EXCLUDED.name,
                            description = EXCLUDED.description,
                            pos_x       = EXCLUDED.pos_x,
                            pos_y       = EXCLUDED.pos_y
                    """, d.id, d.type_id, d.name, d.description, d.pos_x, d.pos_y)
                    device_id_map[d.id] = d.id
                else:
                    # New device (id == 0 or negative) — insert and get real id
                    row = await conn.fetchrow("""
                        INSERT INTO devices (type_id, name, description, pos_x, pos_y)
                        VALUES ($1, $2, $3, $4, $5)
                        RETURNING id
                    """, d.type_id, d.name, d.description, d.pos_x, d.pos_y)
                    device_id_map[d.id] = row["id"]

            # ── Upsert ports ───────────────────────────────────────────────────
            port_id_map: dict[int, int] = {}
            for d in payload.devices:
                real_device_id = device_id_map[d.id]
                for p in d.ports:
                    if p.id > 0:
                        await conn.execute("""
                            INSERT INTO ports (id, device_id, direction, name, port_order)
                            VALUES ($1, $2, $3, $4, $5)
                            ON CONFLICT (id) DO UPDATE SET
                                device_id  = EXCLUDED.device_id,
                                direction  = EXCLUDED.direction,
                                name       = EXCLUDED.name,
                                port_order = EXCLUDED.port_order
                        """, p.id, real_device_id, p.direction, p.name, p.port_order)
                        port_id_map[p.id] = p.id
                    else:
                        row = await conn.fetchrow("""
                            INSERT INTO ports (device_id, direction, name, port_order)
                            VALUES ($1, $2, $3, $4)
                            RETURNING id
                        """, real_device_id, p.direction, p.name, p.port_order)
                        port_id_map[p.id] = row["id"]

            # ── Upsert connections ─────────────────────────────────────────────
            for c in payload.connections:
                src = port_id_map.get(c.source_port, c.source_port)
                tgt = port_id_map.get(c.target_port, c.target_port)
                if c.id > 0:
                    await conn.execute("""
                        INSERT INTO connections (id, source_port, target_port)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (id) DO UPDATE SET
                            source_port = EXCLUDED.source_port,
                            target_port = EXCLUDED.target_port
                    """, c.id, src, tgt)
                else:
                    await conn.execute("""
                        INSERT INTO connections (source_port, target_port)
                        VALUES ($1, $2)
                        ON CONFLICT (source_port, target_port) DO NOTHING
                    """, src, tgt)

    return await get_graph()
