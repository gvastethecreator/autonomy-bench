La ruta está en `output/index.html`, pero no la he ejecutado. El sandbox me bloqueó el acceso a un navegador y a `node --check`, así que no vi ni un fotograma y no comprobé la sintaxis. Ábrela en Chrome o Edge con internet, porque Three.js r128 se carga desde cdnjs. Si algo sale mal, pásame el error de la consola y lo arreglo.

**La ruta**
- Es un circuito cerrado y continuo. Sale de la estación con una cuenta atrás, sube por la cadena hasta 65 m y se frena en la cima.
- Después baja en picado, hace una curva peraltada, un loop vertical, dos colinas de "airtime", una curva larga y vuelve a frenar en la estación. La vuelta se repite sin fin.
- La velocidad sale de la energía (altura, fricción y frenos). Los g del HUD son la fuerza real sobre el asiento, según la curvatura de la ruta.
- La cámara va en primera persona, con la barra de seguridad y el morro del carro a la vista. La cabeza se retrasa un poco en los giros y sube o baja con los g. También hay temblor por la velocidad, un campo de visión que crece con ella y visión de túnel con muchos g.

**Ambiente**
- El cielo tiene nubes, sol, luna y estrellas. Cambia entre atardecer dorado, crepúsculo, noche y amanecer en unos 260 s, y la niebla y las luces cambian con él.
- El entorno incluye montañas nevadas, un lago, unos 4.000 pinos y un pueblo lejano con luces.
- El parque tiene noria, carrusel, puestos y farolas. La estación tiene un cartel de "Twilight Express" en un arco.
- Las luces de la ruta parpadean en cadena y los fuegos artificiales salen de noche.
- Aparecen rótulos por tramo ("The Ascent", "Free Fall", "The Loop"…) y un HUD con velocidad, altura, g y vuelta.
- El sonido se genera en el navegador: viento, traqueteo, clics de la cadena, un pad ambiental y campanas. Empieza con el primer clic o tecla.

**Controles:** `Espacio` pausa, `M` silencia, `H` oculta el HUD y `F` pone pantalla completa.

**Riesgos que no pude comprobar**
- El peralte lo deduje solo con matemáticas, y podría estar inclinado al lado contrario en las curvas.
- En el loop calculo unos 5,8 g abajo. Lo amortigüé con visión de túnel, pero puede sentirse fuerte.
