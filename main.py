from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.exceptions import HTTPException
from starlette.exceptions import HTTPException as StarletteHTTPException

from config import settings

app = FastAPI(
    title="JSON Viewer",
    description="A modern JSON viewer and formatter with VS Code-like editor",
    debug=settings.debug,
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "title": "JSON Viewer/Formatter",
            "ga_tracking_id": settings.ga_tracking_id,
            "app_env": settings.app_env,
        },
    )


@app.get("/robots.txt")
async def robots():
    return FileResponse("static/robots.txt", media_type="text/plain")


@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    return templates.TemplateResponse(
        "404.html",
        {"request": request},
        status_code=404
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
