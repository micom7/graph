from pydantic import BaseModel
from typing import Optional


# ── Device Types ──────────────────────────────────────────────────────────────

class DeviceType(BaseModel):
    id: int
    name: str
    label: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None


# ── Ports ─────────────────────────────────────────────────────────────────────

class PortIn(BaseModel):
    direction: str          # 'in' | 'out'
    name: str
    port_order: int = 0


class PortUpdate(BaseModel):
    name: Optional[str] = None
    port_order: Optional[int] = None


class Port(BaseModel):
    id: int
    device_id: int
    direction: str
    name: str
    port_order: int


# ── Devices ───────────────────────────────────────────────────────────────────

class DeviceIn(BaseModel):
    type_id: int
    name: str
    description: Optional[str] = None
    pos_x: float = 0.0
    pos_y: float = 0.0


class DeviceUpdate(BaseModel):
    type_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None


class Device(BaseModel):
    id: int
    type_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    pos_x: float
    pos_y: float


# ── Connections ───────────────────────────────────────────────────────────────

class ConnectionIn(BaseModel):
    source_port: int
    target_port: int


class Connection(BaseModel):
    id: int
    source_port: int
    target_port: int


# ── Full Graph (import / export) ──────────────────────────────────────────────

class PortGraph(BaseModel):
    id: int
    direction: str
    name: str
    port_order: int = 0


class DeviceGraph(BaseModel):
    id: int
    type: Optional[str] = None       # device_types.name
    type_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    pos_x: float
    pos_y: float
    ports: list[PortGraph] = []


class GraphPayload(BaseModel):
    devices: list[DeviceGraph]
    connections: list[Connection]
