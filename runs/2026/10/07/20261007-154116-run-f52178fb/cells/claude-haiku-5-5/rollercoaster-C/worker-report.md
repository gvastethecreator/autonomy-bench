Creé `output/index.html`, pero no lo he abierto en un navegador ni he validado la sintaxis: el comando de comprobación requirió aprobación y no lo ejecuté.

La carpeta `output` estaba vacía, así que no había un trabajo parcial que retomar y empecé el archivo desde cero, en tres partes.

Qué contiene:
- **Recorrido continuo:** un circuito cerrado con subida en cadena, caída, valle, joroba, horquilla, tramo helicoidal y regreso a la estación. La velocidad sale de la energía del recorrido y se frena al llegar a la estación.
- **Cámara en primera persona:** se inclina en las curvas y sube el campo de visión con la velocidad. Hay barra de seguridad, vibración a alta carga g y balanceo suave.
- **Ambiente:** ciclo día-noche de unos 200 s con cielo degradado, sol, estrellas, niebla, colinas, skyline lejano, lago, árboles y polvo en suspensión.
- **HUD:** velocidad, altura, carga g, progreso de vuelta, hora y nombre de la sección. Espacio pausa y H oculta el HUD.

Límites:
- No hay audio.
- No hay rizo vertical; uso una hélice para el giro.
- La física es aproximada y pensada para que se vea bien, no para ser exacta.
- Three.js se carga desde jsDelivr (`three@0.160.0`).

Siguiente paso: abrir el archivo en el navegador para confirmar que carga sin errores y revisar el ritmo del recorrido.
