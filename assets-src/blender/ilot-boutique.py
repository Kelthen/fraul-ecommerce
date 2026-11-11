# Îlot central de la boutique (vitrine à accessoires) fini dans Blender (retour de Rhamone du 9 nov. : « comptoir très
# brut »). Mêmes cotes que le code (src/walk/engine.js, buildStore) : corps 2,40 × 0,90 × 1,60 m centré en z = −8,80,
# plateau à 0,90 m, cloche de verre 2,30 × 0,62 × 1,50 m. Formes seules : les matières (« Pierre », « Marbre »,
# « Champagne ») sont posées par le moteur avec les textures du site ; le verre reste dessiné par le moteur.
# Lancer : blender -b -P assets-src/blender/ilot-boutique.py -- public/models/ilot.glb   (ou python avec le module bpy)
import bpy, sys

out = sys.argv[sys.argv.index("--") + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
CZ = -8.8  # centre de l'îlot (three z)


def mat(name):
    return bpy.data.materials.get(name) or bpy.data.materials.new(name)


def box(name, sx, sy, sz, x, y3, z3, material, bevel=0.0, seg=3):
    """Pavé en coordonnées three (x, y vertical, z vers l'entrée) → Blender (x, −z, y), biseauté."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z3, y3))
    o = bpy.context.object
    o.name = name
    o.scale = (sx, sz, sy)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(mat(material))
    if bevel:
        m = o.modifiers.new("biseau", "BEVEL")
        m.width, m.segments, m.limit_method, m.angle_limit = bevel, seg, "ANGLE", 0.6
        bpy.ops.object.modifier_apply(modifier=m.name)
    return o


def uv(o, size=1.0):
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.cube_project(cube_size=size)
    bpy.ops.object.mode_set(mode="OBJECT")
    o.select_set(False)


def join(name, objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = name
    return objs[0]


# Corps en pierre posé sur un socle en retrait (ligne d'ombre au sol), arêtes adoucies.
corps = join("Corps", [
    box("c", 2.40, 0.80, 1.60, 0, 0.10 + 0.40, CZ, "Pierre", 0.018),
    box("s", 2.30, 0.10, 1.50, 0, 0.05, CZ, "Pierre", 0.006),
])
uv(corps, 0.6)
# Plateau en marbre de 6 cm qui déborde de 3 cm, chant arrondi.
plateau = box("Plateau", 2.46, 0.06, 1.66, 0, 0.90 + 0.03, CZ, "Marbre", 0.02, 4)
uv(plateau, 2.4)
# Cloche : fins montants et traverses champagne (1,5 cm) autour du verre, au lieu des arêtes noires.
W, H, D, Y0 = 2.30, 0.62, 1.50, 0.96
bars = []
for sx in (-1, 1):
    for sz in (-1, 1):
        bars.append(box("m", 0.015, H, 0.015, sx * W / 2, Y0 + H / 2, CZ + sz * D / 2, "Champagne", 0.004, 2))
for y in (Y0 + 0.008, Y0 + H):
    for sz in (-1, 1):
        bars.append(box("t", W, 0.015, 0.015, 0, y, CZ + sz * D / 2, "Champagne", 0.004, 2))
    for sx in (-1, 1):
        bars.append(box("t", 0.015, 0.015, D, sx * W / 2, y, CZ, "Champagne", 0.004, 2))
cadre = join("Cadre", bars)
uv(cadre, 1.0)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True, export_yup=True, export_materials="EXPORT", export_normals=True, use_selection=True)
for o in bpy.context.scene.objects:
    print("OBJET", o.name, len(o.data.polygons), "faces", [round(v, 3) for v in o.dimensions])
