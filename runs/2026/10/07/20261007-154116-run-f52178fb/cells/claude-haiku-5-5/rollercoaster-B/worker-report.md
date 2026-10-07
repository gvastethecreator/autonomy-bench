He creado `output/index.html`: un paseo en montaña rusa en primera persona, en un solo archivo, con Three.js cargado desde unpkg y reproducción continua en bucle. No lo he visto renderizar ni he comprobado la sintaxis, porque el sandbox bloqueó los comandos para ejecutar `node --check` y no hay navegador disponible desde aquí.

- **Pista:** circuito cerrado con subida en cadena, caída, joroba, rizo vertical, giro largo y zona de frenado antes de volver a la estación.
- **Velocidad:** la física de energía en la caída, velocidad fija en la subida y frenado antes de la estación.
- **Extras:** cámara con inclinación en las curvas, efecto de velocidad, barra de seguridad, sonido de viento y traqueteo de cadena (tecla M para silenciar), mirar arrastrando el ratón y HUD con velocidad, altura y vuelta.

Lo que hay que comprobar al abrirlo en el navegador: que el rizo no se cruce con el tramo de entrada (lo calculé a mano con una separación lateral de 5.5 m), que el frenado y la velocidad se sientan bien y que no haya errores en consola. Es probable que haga falta ajustar alturas o separaciones tras verlo.
