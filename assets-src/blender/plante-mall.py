# Plante de luxe du mall (olivier en pot), modélisée par script dans Blender 5 (Rhamone, 8 nov. 2026).
# Usage : python assets-src/blender/plante-mall.py -- assets-src/models/plante_mall.glb [rendu.png], puis node scripts/prep-decor.mjs
# Noms de matières lus par walkMaterials() (engine.js) : Marbre_Pot, Laiton_Bord, Terre, Tronc, Feuille_A, Feuille_B.
import bpy, bmesh, math, random, sys
from mathutils import Vector
args = sys.argv[sys.argv.index("--") + 1:]
out, render = args[0], (args[1] if len(args) > 1 else None)
random.seed(7)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def mat(name, rgb, rough=0.5, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    return m

M = {k: mat(k, *v) for k, v in {
    "Marbre_Pot": ((0.86, 0.83, 0.78), 0.25), "Laiton_Bord": ((0.78, 0.66, 0.42), 0.3, 0.9), "Terre": ((0.18, 0.14, 0.11), 0.9),
    "Tronc": ((0.36, 0.29, 0.22), 0.8), "Feuille_A": ((0.20, 0.28, 0.16), 0.6), "Feuille_B": ((0.30, 0.38, 0.22), 0.6)}.items()}

def obj(o, m): o.data.materials.append(M[m]); return o

# Pot : cylindre légèrement évasé, bord laiton, terre
bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.62, depth=0.95, location=(0, 0, 0.475)); pot = obj(bpy.context.object, "Marbre_Pot")
bm = bmesh.new(); bm.from_mesh(pot.data)
for v in bm.verts:
    if v.co.z > 0: v.co.x *= 1.12; v.co.y *= 1.12
bm.to_mesh(pot.data); bm.free()
bpy.ops.mesh.primitive_torus_add(major_radius=0.69, minor_radius=0.035, major_segments=40, minor_segments=8, location=(0, 0, 0.95)); obj(bpy.context.object, "Laiton_Bord")
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.66, depth=0.04, location=(0, 0, 0.9)); obj(bpy.context.object, "Terre")

# Tronc unique, puis trois branches qui s'ouvrent (olivier)
bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.07, depth=1.3, location=(0, 0, 1.55)); obj(bpy.context.object, "Tronc")
tips = []
for k in range(3):
    a = k * math.tau / 3 + 0.4; tilt = 0.45
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.04, depth=1.1, location=(0, 0, 0))
    b = obj(bpy.context.object, "Tronc"); b.rotation_euler = (tilt * math.sin(a), -tilt * math.cos(a), 0)
    d = b.rotation_euler.to_matrix() @ Vector((0, 0, 0.55)); b.location = Vector((0, 0, 2.15)) + d
    tips.append(Vector((0, 0, 2.15)) + d * 2)

# Feuillage : beaucoup de petites grappes lisses autour du bout des branches (~3 000 triangles)
for i in range(46):
    t = tips[i % 3] + Vector((random.uniform(-0.45, 0.45), random.uniform(-0.45, 0.45), random.uniform(-0.25, 0.5)))
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=random.uniform(0.17, 0.3), location=t)
    f = obj(bpy.context.object, "Feuille_A" if i % 3 else "Feuille_B")
    for v in f.data.vertices: v.co += Vector((random.uniform(-0.04, 0.04) for _ in range(3)))

bpy.ops.object.select_all(action="SELECT")
for o in bpy.context.selected_objects:
    bpy.context.view_layer.objects.active = o
    (bpy.ops.object.shade_smooth if o.data.materials[0].name.startswith(("Feuille", "Marbre", "Laiton")) else bpy.ops.object.shade_flat)()
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True, export_yup=True)

if render:
    sc.render.engine = "CYCLES"; sc.cycles.samples = 32; sc.render.resolution_x, sc.render.resolution_y = 600, 800
    w = bpy.data.worlds.new("w"); w.use_nodes = True; w.node_tree.nodes["Background"].inputs[0].default_value = (0.95, 0.93, 0.9, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 1.2; sc.world = w
    bpy.ops.mesh.primitive_plane_add(size=20); obj(bpy.context.object, "Marbre_Pot")
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = (0, -7.5, 1.9); cam.rotation_euler = (math.radians(88), 0, 0)
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); sun.data.energy = 3; sun.rotation_euler = (0.7, 0.3, 0.5); sc.collection.objects.link(sun)
    sc.render.filepath = render; bpy.ops.render.render(write_still=True)
