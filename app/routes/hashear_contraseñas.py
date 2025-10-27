from app.database import SessionLocal
from app import models, security

def hashear_contraseñas_existentes():
    db = SessionLocal()
    usuarios = db.query(models.Usuario).all()

    for usuario in usuarios:
        # Evita volver a hashear si ya está hasheada
        if not usuario.contraseña.startswith("$2b$"):  # bcrypt siempre comienza con $2b$
            print(f"🔒 Hasheando contraseña de: {usuario.usuario}")
            usuario.contraseña = security.hash_password(usuario.contraseña)
            db.add(usuario)

    db.commit()
    db.close()
    print("✅ Contraseñas actualizadas correctamente.")

if __name__ == "__main__":
    hashear_contraseñas_existentes()