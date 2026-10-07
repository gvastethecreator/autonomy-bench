Escribí el coaster en `output/index.html`, pero no lo he probado en navegador. La comprobación de sintaxis con Node pidió aprobación y no la ejecuté.

**Qué hay en el archivo:**
- **Circuito:** un bucle cerrado de Catmull-Rom con subida de cadena (lift) al inicio y caídas y colinas después. Los rieles, las traviesas, los soportes y unos 600 árboles se generan en código.
- **Física:** la velocidad sale de la conservación de energía (altura y velocidad), con un amortiguamiento leve. En la subida la velocidad se fija en 14 m/s. Como todas las alturas quedan por debajo de la cima de la subida, el tren no debería detenerse.
- **Cámara:** primera persona a la altura de la cabeza, mirando hacia delante a lo largo del riel. El FOV crece con la velocidad y hay una vibración leve.
- **Reproducción continua:** el paseo se repite en bucle sin parar. Clic para empezar, Espacio para pausar y reanudar. El HUD muestra velocidad, altura, vuelta y progreso.
- **Dependencia:** Three.js r128 desde cdnjs, así que hace falta conexión a internet.

**Sin verificar:** que la escena se renderice, que la cámara siga bien el riel en las caídas y que la velocidad no se vuelva implausible. Esto último depende de las constantes `G`, `DAMP` y `LIFT_V`, que son ajustes de sensación y no están calibrados.

**Lo que dejé fuera:** lazos o inversiones (la cámara usa "arriba" fijo, así que el circuito no debe dar vueltas de campana), sonido y sombras. Los añado si los necesitas.

Para verlo, abre `output/index.html` en un navegador con WebGL.
