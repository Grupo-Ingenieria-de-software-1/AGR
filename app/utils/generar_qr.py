import qrcode
from io import BytesIO
from fastapi.responses import StreamingResponse

def generar_qr_con_datos(data: str):
    qr = qrcode.make(data)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="image/png")