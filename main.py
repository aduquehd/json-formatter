from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
