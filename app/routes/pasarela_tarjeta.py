from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app import models, schemas
import os, hashlib, requests

router = APIRouter(prefix="/payu", tags=["Pasarela PayU"])

@router.post("/iniciar")
def iniciar_pago(pago: schemas.PagoCreate, db: Session = Depends(get_db)):
    """
    Crea una transacción PayU y devuelve la URL para redirigir al cliente.
    """
    pedido = db.query(models.Pedido).options(joinedload(models.Pedido.detalle_pedido)).filter(
        models.Pedido.id_pedido == pago.id_pedido
    ).first()

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    total = sum(float(d.subtotal) for d in pedido.detalle_pedido)
    
    # Credenciales
    merchant_id = os.getenv("PAYU_MERCHANT_ID")
    account_id = os.getenv("PAYU_ACCOUNT_ID")
    api_key = os.getenv("PAYU_API_KEY")

    # Firma digital requerida por PayU
    reference = f"pedido_{pedido.id_pedido}"
    signature_str = f"{api_key}~{merchant_id}~{reference}~{int(total)}~COP"
    signature = hashlib.md5(signature_str.encode('utf-8')).hexdigest()

    # Datos del formulario
    payu_url = "https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/"
    data = {
        "merchantId": merchant_id,
        "accountId": account_id,
        "description": f"Pago pedido #{pedido.id_pedido}",
        "referenceCode": reference,
        "amount": total,
        "currency": "COP",
        "signature": signature,
        "buyerFullName": pago.cliente or "Cliente",
        "responseUrl": "http://localhost:8000/payu/respuesta",  # callback de respuesta
        "confirmationUrl": "http://localhost:8000/payu/confirmacion",  # callback del servidor
        "test": 1,  # 1 = modo pruebas
    }

    return JSONResponse(content={
        "url": payu_url,
        "params": data
    })


@router.post("/confirmacion")
def confirmacion(datos: dict, db: Session = Depends(get_db)):
    """
    Recibe la confirmación del pago por parte de PayU.
    """
    reference = datos.get("reference_sale")
    estado = datos.get("state_pol")
    monto = float(datos.get("value", 0))

    if not reference:
        raise HTTPException(status_code=400, detail="Falta referencia de pago")

    pedido_id = int(reference.replace("pedido_", ""))
    pedido = db.query(models.Pedido).filter(models.Pedido.id_pedido == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    if estado == "4":  # 4 = Aprobado
        nuevo_pago = models.Pago(
            id_pedido=pedido.id_pedido,
            monto=monto,
            metodo_pago="tarjeta",
            cliente="Pago vía PayU"
        )
        pedido.estado = "pagado"
        db.add(nuevo_pago)
        db.commit()
        return {"status": "ok", "mensaje": "Pago aprobado y registrado"}
    else:
        return {"status": "rechazado", "mensaje": "El pago no fue aprobado"}