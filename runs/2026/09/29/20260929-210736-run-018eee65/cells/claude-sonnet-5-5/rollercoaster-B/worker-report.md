Terminé `output/index.html`, pero no pude probarlo: nunca se renderizó ni se abrió en un navegador. Los permisos bloquearon Chrome headless, y PowerShell falla con "línea de comandos demasiado larga". Solo lo revisé leyendo el código.

Carga Three.js r128 desde cdnjs, así que necesita internet.

**Qué es**
- **Recorrido:** un circuito cerrado de unos 1,5 km al atardecer. Sale de la estación, sube por la cadena hasta unos 65 m y baja por la primera caída. Sigue un looping vertical, una colina de airtime, una curva peraltada, cuatro camelbacks y una hélice de regreso a la estación. Después vuelve a empezar sin corte, así que se reproduce sin fin.
- **Cámara:** vas sentado en el carro. Se ve la barra de seguridad, los puños y el capó. Miras hacia adelante en curvas y cimas, el campo de visión crece con la velocidad, hay vibración y un viñeteado que sube con la fuerza G. Puedes arrastrar el ratón para mirar alrededor.
- **Velocidad:** es física simple de energía. Va lento en la estación y en la cadena, y luego acelera en las caídas. El peralte sale de la carga lateral.
- **Ambiente:** cielo con nubes, sol bajo y estrellas. Hay terreno con lago, unos 2.200 árboles, una rueda de la fortuna, carpas de feria y una estación con un cartel. Las luces del riel se encienden en cadena.
- **Sonido:** rodadura, viento, clacks en las juntas, cadena de subida y gritos en la caída y el looping. Se activa con el botón o la tecla `M`, porque el navegador no deja reproducir audio antes de un clic.
- **HUD:** km/h, altura, G, nombre de cada sección, minimapa y contador de vueltas.
- **Controles:** `Espacio` pausa y `H` oculta el HUD. Con `?at=0.3` en la URL (o cualquier valor entre 0 y 1) empieza en ese punto del circuito.

**Sin verificar**
- Que no haya errores de JavaScript.
- Que la cámara quede bien en el looping y en las caídas.
- Que los puntos de luz y la fuerza G se vean como espero.

Dejé un script de captura para revisarlo cuando puedas correrlo. Está en `...\abd2f10f-2ea9-435b-8fb9-60e8a5849e43\scratchpad\run.sh` dentro del directorio scratchpad, y se ejecuta con `bash <ruta>`. Guarda una captura y un log por cada punto del circuito. Si lo ejecutas, reviso las capturas y corrijo lo que salga mal.
