from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Pedido
from app.utils.generar_qr import generar_qr_con_datos

router = APIRouter(prefix="/qr", tags=["Pasarela QR"])

@router.get("/generar/{id_pedido}")
def generar_qr_pago(id_pedido: int, db: Session = Depends(get_db)):
    """
    Genera un QR con los datos de la cuenta Nequi del restaurante.
    """
    pedido = db.query(Pedido).options(joinedload(Pedido.detalle_pedido)).filter(
        Pedido.id_pedido == id_pedido
    ).first()

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    total = sum(float(det.subtotal) for det in pedido.detalle_pedido)
    
    # 👇 COLOCA TU NÚMERO DE NEQUI REAL AQUÍ
    datos_pago = (
        f"Nequi: 3215644673\n"  # 🔴 CAMBIA ESTE NÚMERO
        f"Valor: ${total:,.0f}\n"
        f"Ref: Pedido #{pedido.id_pedido}\n"
        f"AGR-PAGO-QR"
    )

    return generar_qr_con_datos(datos_pago)