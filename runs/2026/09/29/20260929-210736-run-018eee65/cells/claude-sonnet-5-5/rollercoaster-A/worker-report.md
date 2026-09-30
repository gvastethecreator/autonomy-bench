I couldn't run the syntax check, because the command needed approval, so the coaster is untested. I haven't opened it in a browser either.

It's a single file, `output/index.html`, built with Three.js loaded from a CDN. It needs an internet connection to load.

- **Ride:** the track is a closed loop. It starts with a chain-lift hill, then a big drop, a camelback hill and banked turns, and returns to the station. It runs continuously with a lap counter and never stops.
- **View:** you ride at the front of the car with the hood and lap bar in view. The camera banks into turns, shakes with speed, and widens its field of view as you go faster.
- **Physics:** speed is constant on the lift, then follows energy and drag after the crest.
- **Controls:** drag to look around, and the view eases back to center when you let go. Space pauses. A HUD shows speed, height, an approximate g-force and the lap.
- **Sound:** rumble, wind and track clacks, with a slower clack on the chain lift. It turns on with your first click and can be toggled with the Sound button.
- **Scenery:** sunset sky, trees, mountains, a lake, and support towers under the track.

Before you rely on it, open it in a browser and check three things:
- **Banking:** it should tilt into each turn and not away from it.
- **Steep drop:** the camera should stay steady through it.
- **Hood:** it should sit where you expect at the bottom of the view.
