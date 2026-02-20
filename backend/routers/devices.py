from fastapi import APIRouter, HTTPException
from database import get_pool
from models import Device, DeviceIn, DeviceUpdate, DeviceType

router = APIRouter(prefix="/api", tags=["devices"])


@router.get("/device-types", response_model=list[DeviceType])
async def list_device_types():
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT id, name, label, color, icon FROM device_types ORDER BY id")
    return [DeviceType(**dict(r)) for r in rows]


@router.get("/devices", response_model=list[Device])
async def list_devices():
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, type_id, name, description, pos_x, pos_y FROM devices ORDER BY id"
        )
    return [Device(**dict(r)) for r in rows]


@router.post("/devices", response_model=Device, status_code=201)
async def create_device(body: DeviceIn):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO devices (type_id, name, description, pos_x, pos_y)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, type_id, name, description, pos_x, pos_y
        """, body.type_id, body.name, body.description, body.pos_x, body.pos_y)
    return Device(**dict(row))


@router.put("/devices/{device_id}", response_model=Device)
async def update_device(device_id: int, body: DeviceUpdate):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, type_id, name, description, pos_x, pos_y FROM devices WHERE id = $1",
            device_id,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Device not found")

        updated = dict(row)
        for field, val in body.model_dump(exclude_none=True).items():
            updated[field] = val

        row = await conn.fetchrow("""
            UPDATE devices SET type_id=$1, name=$2, description=$3, pos_x=$4, pos_y=$5
            WHERE id=$6
            RETURNING id, type_id, name, description, pos_x, pos_y
        """, updated["type_id"], updated["name"], updated["description"],
            updated["pos_x"], updated["pos_y"], device_id)
    return Device(**dict(row))


@router.delete("/devices/{device_id}", status_code=204)
async def delete_device(device_id: int):
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM devices WHERE id = $1", device_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Device not found")
