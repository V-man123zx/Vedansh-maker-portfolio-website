// Every project on the site, in showroom order. Text comes from the original portfolio's database.
// `model` is the kind of build (it sizes the CAD on its stage); set `cad` to a .glb in /public/cad to show the real CAD.
import MEDIA from "./media.json";

const GH = "GitHub";
const VIDEO_CAPS = {
  drone: ["Takeoff", "Hover"], hand: ["Finger test"], poker: ["Dealing"], droneassist: ["Glove control"],
  drilltap: ["Cell running", "Cell running · 2"], tripteron: ["Motion test"], hydro: ["The system"], roomba: ["Driving"], gib: ["Gameplay"]
};
const P = (slug, title, cat, wip, model, summary, detail, spec, tags, links = []) => ({
  slug, title, cat, status: wip ? "In progress" : "Complete", wip, model, cad: null,
  summary, detail, spec, tags, links,
  videos: MEDIA[slug].v.map((v, i) => ({ ...v, c: VIDEO_CAPS[slug]?.[i] || "Video", src: `/m/${v.f}`, poster: `/m/${v.f.replace(".mp4", ".jpg")}` })),
  photos: MEDIA[slug].p.map(p => ({ ...p, src: `/m/${p.f}` }))
});

export const PROJECTS = [
  P("drone", "UAS4STEM drone", "Aerial robotics", true, "drone",
    "A search-and-rescue drone built with the Aerodactyls UAV design team for the UAS4STEM challenge, rebuilt every season.",
    "Carbon fiber frame with 3D printed mounts, an ArduPilot flight stack and computer-vision hardware for spotting targets on the field.",
    [["Competition", "UAS4STEM Search & Rescue"], ["Team", "Aerodactyls UAV design team"], ["Flight stack", "ArduPilot"], ["Frame", "Carbon fiber, 3D printed mounts"]],
    ["Drone electronics", "Electromechanical systems", "Computer vision hardware", "ArduPilot"],
    [[GH, "https://github.com/UnityGranted/venus2"], ["Team page", "https://www.linkedin.com/company/aerodactyls-uav-design-team/"]]),
  P("hand", "15 DoF bionic hand", "Mechanical · robotics", true, "hand",
    "A robotic hand with a mini stepper motor in every finger joint, so it moves like a human hand.",
    "Fifteen independently driven joints: three per finger and three in the thumb. Designed in CAD, 3D printed, with its own driver PCB.",
    [["Degrees of freedom", "15"], ["Actuation", "Mini stepper per joint"], ["Build", "CAD, 3D printing, custom PCB"]],
    ["CAD", "Stepper motors", "PCB design", "3D printing"]),
  P("hexplorer", "Hexplorer robot dog", "Robotics", true, "hexapod",
    "A six-legged industrial robot dog on ROS2 that can follow people and colored objects.",
    "It sees with lidar and an Intel RealSense camera and runs YOLOv8n for detection. Lidar odometry and a search algorithm are in progress.",
    [["Platform", "ROS2"], ["Perception", "YOLOv8n, lidar, RealSense"], ["Legs", "6"]],
    ["Python", "ROS2", "LIDAR", "RealSense", "YOLOv8n"],
    [[GH, "https://github.com/V-man123zx/hexplorer-robot-config"], ["Video", "https://youtube.com/shorts/Y1gR_UqgIwU"], ["LinkedIn post", "https://www.linkedin.com/posts/anton-koretskov-816576103_lesson-2-follow-yellow-box-vedansh-wadhwani-activity-7424643832362926080-Xo_h"]]),
  P("poker", "Poker dealer robot", "ICR247 · industrial", false, "arm",
    "An automated card dealer built on a Dobot CR3A cobot. It's rented out and used to teach industrial robot programming.",
    "Pneumatic card handling, an HMI to run the game and Dobot Studio Pro programs for each deal.",
    [["Robot", "Dobot CR3A"], ["Interface", "HMI"], ["Actuation", "Pneumatics"], ["Software", "Dobot Studio Pro"]],
    ["HMI programming", "Dobot CR3A", "CAD", "Dobot Studio Pro", "Pneumatics"],
    [["Video", "https://www.youtube.com/watch?v=q0Jw_-OwBOE"]]),
  P("drink", "Drink tending robot", "ICR247 · industrial", false, "arm",
    "A conversational, pirate-voiced cobot bartender that's rented out for parties and events.",
    ["Programmed a Dobot CR10A to pick cups, fill them with a Bottoms Up fill system and hand them over", "Connected a Keyence HMI over Modbus for the user interface", "Designed 3D printed cup-gripper fingers and an HMI mount", "Wired relays and pneumatics to drive the gripper", "Made it voice-controlled and conversational with Gemini, Whisper and ElevenLabs"],
    [["Robots", "Dobot CR-10, Nova 5"], ["HMI", "Keyence over Modbus"], ["Voice", "Gemini, Whisper, ElevenLabs"]],
    ["Python", "Dobot Studio Pro", "CAD", "Pneumatics"],
    [[GH, "https://github.com/ICR247/Beer-tending"], ["LinkedIn post", "https://www.linkedin.com/feed/update/urn:li:activity:7365122488621531136/"]]),
  P("droneassist", "DroneAssist", "IoT · wearables", false, "glove",
    "A glove that flies drones. Bend your fingers and tilt your hand to steer drones, robots and RC cars.",
    "Flex sensors and a gyroscope read the hand, a Raspberry Pi Pico turns that into commands and LoRa radios carry them to the vehicle.",
    [["Sensors", "Flex sensors, gyroscope"], ["Controller", "Raspberry Pi Pico"], ["Radio", "LoRa transceivers"], ["Board", "Custom PCB"]],
    ["Embedded programming", "Sensor integration", "LoRa", "Raspberry Pi Pico", "3D printing", "PCB design", "Soldering"]),
  P("safeway", "SAFEWAY", "IoT · safety", false, "board",
    "A wearable early-warning system for highway construction workers.",
    "A speed-measuring unit watches traffic and radios a warning to the worker's wearable. Prototyped on a breadboard, then laid out as a custom board.",
    [["Users", "Highway construction crews"], ["Controller", "RP2040"], ["Interface", "Keypad and LCD"], ["Board", "Custom PCB"]],
    ["PCB design", "Soldering", "Multiplexing", "Serial communication"]),
  P("mechmind", "MechMind drill tap cell", "ICR247 · industrial", false, "arm",
    "A robot cell that bin-picks parts from a tray with a MechMind 3D camera and loads them into a drill/tap machine.",
    "Vision-guided picking, a custom gripper and part fixture, and the program that ties the cell together.",
    [["Vision", "MechMind 3D camera"], ["Task", "Bin picking into drill/tap"], ["Built at", "ICR247"]],
    ["Computer vision", "Industrial robot programming", "CAD"],
    [[GH, "https://github.com/V-man123zx/Mech_mind_drill_tap/tree/master"]]),
  P("drilltap", "Drill and tap robot cell", "ICR247 · industrial", false, "arm",
    "First project at ICR247: a manufacturing cell that drills and taps square nuts in volume.",
    ["Programmed a Yaskawa GP8 on the YRC1000 teach pendant", "Designed a laser-cut steel fixture for stock and finished parts", "Designed 3D printed fingers for the pneumatic gripper", "Designed laser-cut and 3D printed vise jaws to hold stock while drilling and tapping"],
    [["Robot", "Yaskawa GP8, YRC1000"], ["Output", "Square nuts"]],
    ["Yaskawa robots", "CAD", "Simulation", "Laser cutting"]),
  P("tripteron", "Parallel axis tripteron", "Robotics", true, "gantry",
    "A tripteron: a parallel motion system spotted on YouTube, with little to no academic research behind it.",
    "Three linear axes move one carriage through parallel arms. Frame, carriages and arms designed in CAD and driven by stepper motors.",
    [["Kinematics", "Parallel, 3 linear axes"], ["Actuation", "Stepper motors"]],
    ["Stepper motors", "Electromechanical systems", "CAD", "Motion systems"]),
  P("parttable", "Mobile part table", "ICR247 · industrial", false, "table",
    "A steel table that rides on a Pudu T300 mobile robot and carries laser-cut parts to the MechMind cell.",
    "Laser tube-cut steel, welded, and documented with mechanical drawings.",
    [["Robot", "Pudu T300"], ["Material", "Laser tube-cut steel"]],
    ["CAD", "Laser tube cutting", "Welding", "Mechanical drawings"]),
  P("welding", "Welding fixture", "Mechanical", false, "fixture",
    "A fixture for an automated Dobot welding setup.", "Designed in CAD and built from laser-cut steel.",
    [["Used in", "Dobot welding cell"]], ["CAD", "Laser cutting", "Welding"]),
  P("autodoor", "Autodoor sheet metal cover", "Mechanical", false, "sheet",
    "A sheet metal cover for a CNC machine's automatic door assembly.", "Designed as sheet metal in CAD, laser cut and formed on a press brake.",
    [["Process", "Laser cut, press brake"]], ["Sheet metal CAD", "Press brake", "Laser cutting"]),
  P("volleyball", "Volleyball display piece", "Mechanical", false, "ball",
    "Stainless steel, laser cut and bent into a volleyball on a press brake.", "Flat-pattern design in CAD, then formed by hand on the brake.",
    [["Material", "Stainless steel"], ["Process", "Laser cut, press brake"]], ["CAD", "Sheet metal", "Laser cutting", "Press brake"]),
  P("yale", "Yale Model Q OpenHand", "3D printing", false, "gripper",
    "Yale's OpenHand Model Q, reworked to use 3D printed TPU and TPE instead of cast resin.", "Fingers and joints redesigned for multi-material printing.",
    [["Base design", "Yale OpenHand Model Q"], ["Materials", "TPU, TPE"]], ["CAD", "Multi-material 3D printing"]),
  P("hydro", "Hydroponics system", "Mechanical", false, "hydro",
    "An automated hydroponics system for growing small plants.",
    "Three designs sketched first (drip, nutrient film technique and deep water culture) before building one with Arduino control and laser-cut and printed parts.",
    [["Control", "Arduino"], ["Designs explored", "Drip, NFT, deep water culture"]], ["Arduino", "Electronics", "Laser cutting", "3D printing"]),
  P("p2p", "Peer-to-peer IoT network", "IoT", false, "mesh",
    "A research proof of concept for IoT devices that talk to each other directly, with no central hub.", "Built on ESP32 boards programmed with Arduino.",
    [["Hardware", "ESP32"]], ["ESP32", "Arduino", "Networking", "Wireless communication"]),
  P("roomba", "Party Roomba", "Electronics", true, "rover",
    "A small drivable round robot with a built-in Bluetooth speaker and RGB lights.",
    "Custom body in CAD and a custom PCB with an HC-12 radio, a Bluetooth audio module, a PAM8403 amplifier, motor drivers and battery management.",
    [["Radio", "HC-12"], ["Audio", "Bluetooth module, PAM8403 amp"], ["Board", "Custom PCB"]], ["CAD", "PCB design", "Electronics"]),
  P("gib", "Game in a Box", "Electronics · first build", false, "box",
    "A reaction-time game, made in 7th grade while bored during COVID. It has been through many versions since.",
    "Fun fact: I didn't know LEDs needed resistors and even made a PCB without them. The Raspberry Pi Pico's limited output current kept them from burning out.",
    [["Built", "7th grade"], ["Controller", "Raspberry Pi Pico"], ["Board", "Custom PCB"], ["Case", "3D printed"]],
    ["Raspberry Pi Pico", "3D printing", "PCB design", "Soldering"],
    [[GH, "https://github.com/V-man123zx/GIB"], ["Photo album", "https://photos.app.goo.gl/dyWrVYFTrb1tAYro7"]]),
  P("arc", "Arc reactor", "3D printing", false, "reactor",
    "An Iron Man arc reactor display piece.", "A quick project over summer break: printed, painted and set in a display case.",
    [["Process", "3D printing, painting"]], ["CAD", "3D printing", "Painting"]),
  P("spiderman", "Spider-Man statue", "3D printing", false, "statue",
    "A 3D printed and hand-painted Spider-Man statue.", "Printed in parts, then painted by hand.",
    [["Process", "3D printing, painting"]], ["3D printing", "Painting"]),
  P("gifts", "Teacher gifts", "Woodworking", false, "letters",
    "CNC-milled letters and the school's logo, made as gifts for middle school teachers.", "Over 44 hours of CNC time, then painted by hand.",
    [["Machine time", "44+ hours"], ["Process", "CAM, CNC milling"]], ["CNC", "CAM", "Woodworking"]),
  P("workbench", "Workbench", "Woodworking", false, "bench",
    "A custom workbench built from 2x4s, screws and plywood.", "Modeled in CAD first, then built.",
    [["Materials", "2x4s, plywood, screws"]], ["Woodworking", "CAD"])
];

// CAD exported from Fusion (public/cad). Projects not listed here show no model, just their media.
const CAD = ["hand", "poker", "drink", "droneassist", "mechmind", "drilltap", "tripteron", "welding", "yale", "roomba", "gib", "arc", "workbench", "parttable"];
PROJECTS.forEach(p => { if (CAD.includes(p.slug)) p.cad = `/cad/${p.slug}.glb`; });

export const bySlug = Object.fromEntries(PROJECTS.map(p => [p.slug, p]));

// The showroom hangs up to four pieces of media per stop: every video, then photos.
export const stopMedia = p => [...p.videos.map(v => ({ ...v, video: true })), ...p.photos].slice(0, 4);

export const cover = p => (p.photos.find(x => !/cad/i.test(x.c)) || p.photos[0] || { src: p.videos[0]?.poster }).src;

export const PROFILE = {
  name: "Vedansh Wadhwani",
  role: "Engineer & maker · robotics · drones · PCBs",
  email: "vedansh.wadhwani@gmail.com",
  github: "https://github.com/V-man123zx",
  linkedin: "https://www.linkedin.com/in/vedanshw/"
};
