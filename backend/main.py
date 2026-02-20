from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import get_pool, close_pool
from routers import devices, ports, connections, graph


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()          # warm up connection pool
    yield
    await close_pool()


app = FastAPI(title="Graph Route Editor API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph.router)
app.include_router(devices.router)
app.include_router(ports.router)
app.include_router(connections.router)


@app.get("/")
async def root():
    return {"status": "ok"}
