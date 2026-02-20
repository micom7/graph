from fastapi import APIRouter, HTTPException
from database import get_pool
from models import Connection, ConnectionIn

router = APIRouter(prefix="/api/connections", tags=["connections"])


@router.post("", response_model=Connection, status_code=201)
async def create_connection(body: ConnectionIn):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO connections (source_port, target_port)
            VALUES ($1, $2)
            ON CONFLICT (source_port, target_port) DO NOTHING
            RETURNING id, source_port, target_port
        """, body.source_port, body.target_port)
        if not row:
            raise HTTPException(status_code=409, detail="Connection already exists")
    return Connection(**dict(row))


@router.delete("/{connection_id}", status_code=204)
async def delete_connection(connection_id: int):
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM connections WHERE id = $1", connection_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Connection not found")
