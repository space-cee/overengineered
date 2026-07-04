export const changelog = `

4 July 2026:

- signed/unsigned angle normalization
- Mouse buttons and velocity added to Mouse Sensor

3 July 2026:

- Alternate Water Option

30 June 2026:

- toggleable wire vizualizer limits
- fixed plasma breaking blocks in build mode

28 June 2026:

- Triangle tool (programthat) (UE)

27 June 2026:

- slop damage system (plasma only)
- plasma bullet drop
- Classic/Triangle terrain fix (UE)
- LED Display reset fixed (programthat)
- volatile constant



22 June 2026:

- Public AI Block
- LED Display optimizations (programthat)* (UE)
- PID Derivative fix
- Customizable water height
- Fixed freecam speed modifier
- Logic Visualizer bug fix?

15 June 2026 (bug fixes):

- colorable rope
- rope thickness
- missing playerlocatorblock2
- spotlight angle
- target material
- plastic tire colorable + material
- tnt exploded bool
- truss welds
- hollow cy 4 hole welds
report any bugs still in game

15 June 2026:

- Armless Driver Seat
- lower plots
- lighter wheels
- better (hollow)torus models
- lua achievement
- controller sensor logic expanded
- NVME queue
- APN Block

5 June 2026:

- Air Density returned to default (0.01 -> 0.005)

4 June 2026:

- Optimized Destructible Scripts*
- TankWheel1*
- Hollow Wedges*
- Bigger Moon (better gravity?)
- Moon spawn
- Replaced small wheel with original model (newer available as small wheel 2)
- Plot spawn moved to original location (no more running)
- Limb (hand/foot) mounts
- all mounts have toggle bools now 
- all mounts also have shared (prob broken)
- many scripts removed, perfomance should be better.
- New Attractor Logic

*Changes imported from UnderEngineered (with explicit permission)

29 May 2026:

- Experimental Block Syncronizer. Please report any issues*
- Joystick Sensor fixes*
- Updated Joystick and Key Sensor designs
- Inverse Law of Cosine*
*Changes imported from UnderEngineered (with explicit permission)

26 May 2026:

- Joystick Sensor*
- Lua Circuit?

*Changes imported from UnderEngineered (with explicit permission)

25 May 2026:

- Fallback Block fixed*
- New Map Unloader*
- Updated Lighting

*Changes imported from UnderEngineered (with explicit permission)

20 May 2026:

- New Handle Logic*
- Colored Debug Vizualizer (Customizable)*
- Wedge Face 1x1 (just the slope part of a wedge)
- TXM Gears - 40, 120, Bevel (accidental but they will stay in)

*Changes imported from UnderEngineered (with explicit permission)

7 April 2026:

- Private servers now joinable using codes

5 April 2026:

- Adjustable Buildcam speed in extra
- A few server settings in extra
- Mirrored worm gear
- Quarter corner corner wedge 1x1 mirrored
- Square button
- Num to ascii, ascii to num, byte to ascii, ascii to byte
- Half ball hole
- Hollow half ball hole
- Attractor
- Airfoil
- Helical Gears
- Herringbone Gears
- Better gear welds

15 March 2026:

- Proportional Navigation (PN) Block. For Lockheed Martin interns.

12 March 2026:

- Map reworked. Plots are now at ground level.
- Player Locator. Displays the name and position of the closest player to the block
- Map parts can now be loaded individually
- New menu for maps, changelog, and other things.
- Bigger TNT explosion radius

9 March 2026:

- Fixed Swirly Variants not coloring

8 March 2026:

- String to Vector3

7 March 2026:

- Added Joke Folder for Dev blocks not intended for Public

5 March 2026:

- Added New Swirly variants, Lil side, And Big side.
- Changed brightness of "Building light" to 1, instead of 40

27 February 2026:

- Release of NOE Lite. use !lite to join. non-chat method will be available later.

24 February 2026:

- Tree destruction disabled. Please tell us how this affects your performance.

21 February 2026:

- Cylinder hole plug
- Moon with gravity
- Controller Sensor. Tracks stick and trigger position

15 February 2026:

- Private server command. Use "!private" to make a 1 player server
- New fade option for particles. "Switch" allows them to alternate properties forever

14 February 2026:

- Added color, size, and transparency gradients to particle creator. They can now change throughout particle lifetime
- Particle z offset can be modified now

13 February 2026:

- Added building light block (helps to build in the dark)

7 February 2026:

- 5 sizes of spur gears. Compatible by default.
- New worm gear and worm wheel.
- Added More beach assets (I love Lighthouses)
- Laser pointer now returns materials

5 February 2026:

- Machine gun ammo boxes hidden
- Water update, very basic but functional (only thing that floats is the floater block)

3 February 2026:

- Heads now reset when turning off head movement
- Heavier big butter
- Disabled Laser emitter and lens to avoid permanent laser bug
- Added drag detector to handle blocks
- Entire gun rework, material matters, ricochets, better penetration, sounds, recoil and speed changes how powerful gun is!!!

1 February 2026:

- Added Drainage Canal (currently under inspection) WIP
- Told Construction Crew To Stop Slacking Off
- Laid Grass Mats To Grow Grass (STAY OFF!!)
- Added Leg Mount (ok they basically work)

31 January 2026:

- Added Arm Mount (kinda works)
- supports R6 and R15
- Added screen fonts
- Added Inverted blocks
- Added Swirly and Spring

26 January 2026:

- Added Head Mount (probably works)
- Added Head Block (DO NOT ask who's it was)
- Added Lonnnng Handle, because we needed more variety

25 January 2026:

- Added Cut Pyramid Half
- Added Cut Pyramid Quarter

24 January 2026:

- Added physical changelog
- Fixed Hollow Half Cylinder 1 Hole not coloring
`;
