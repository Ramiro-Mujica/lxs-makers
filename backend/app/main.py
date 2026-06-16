from fastapi import FastAPI


app = FastAPI(title="lxs-makers backend")


@app.get("/health")
def health_check():
    return {"status": "ok"}
