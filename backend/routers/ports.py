from fastapi import APIRouter, HTTPException
from database import get_pool
from models import Port, PortIn, PortUpdate

router = APIRouter(prefix="/api/ports", tags=["ports"])


@router.post("", response_model=Port, status_code=201)
async def create_port(body: PortIn, device_id: int):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO ports (device_id, direction, name, port_order)
            VALUES ($1, $2, $3, $4)
            RETURNING id, device_id, direction, name, port_order
        """, device_id, body.direction, body.name, body.port_order)
    return Port(**dict(row))


@router.put("/{port_id}", response_model=Port)
async def update_port(port_id: int, body: PortUpdate):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, device_id, direction, name, port_order FROM ports WHERE id = $1",
            port_id,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Port not found")

        updated = dict(row)
        for field, val in body.model_dump(exclude_none=True).items():
            updated[field] = val

        row = await conn.fetchrow("""
            UPDATE ports SET name=$1, port_order=$2 WHERE id=$3
            RETURNING id, device_id, direction, name, port_order
        """, updated["name"], updated["port_order"], port_id)
    return Port(**dict(row))


@router.delete("/{port_id}", status_code=204)
async def delete_port(port_id: int):
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM ports WHERE id = $1", port_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Port not found")
