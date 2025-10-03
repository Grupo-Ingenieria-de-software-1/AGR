import os
# Diccionario para guardar los usuarios (usuario: contraseña)
usuarios = {}

#funcion para limpiar la consola 
def limpiar_consola():
    
    os.system("clear")
    
# Función para registrar un nuevo usuario
def registrar_usuario():
    print("\n--- Registro de Usuario ---")
    usuario = input("Ingrese un nombre de usuario: ")

    if not usuario.isalpha():
        print("El nombre de usuario solo puede contener letras. Intenta de nuevo.")
        return

    if usuario in usuarios:
        print("Ese usuario ya existe. Intenta con otro.")
        return

    contraseña = input("Ingrese una contraseña: ")
    usuarios[usuario] = contraseña
    print("Registro exitoso. Ahora puede iniciar sesión.")

# Función para iniciar sesión
def iniciar_sesion():
    print("\n--- Inicio de Sesión ---")
    usuario = input("Ingrese su nombre de usuario: ")
    contraseña = input("Ingrese su contraseña: ")


    if usuario in usuarios and usuarios[usuario] == contraseña:
        print(f" Bienvenido {usuario}, has iniciado sesión en el sistema del restaurante.")
    else:
        print("\t El programa no puede continuar por un error")
        print("\t en la digitacion de la contraseña o necesitas")
        print("\t registrarte previamente ")

# Menú principal
def menu():
    while True:
        print("\n--- Menú Restaurante ---")
        print("1. Registrarse")
        print("2. Iniciar Sesión")
        print("3. Salir")

        opcion = input("Seleccione una opción: ")

        if opcion == "1":
            registrar_usuario()
    
        elif opcion == "2":
            iniciar_sesion()
            
        elif opcion == "3":
            print(" Gracias por usar el sistema. ¡Hasta luego!")
            break
        
        else:
            print(" Opción inválida. Intente de nuevo.")
            
# Ejecutar el programa
menu()