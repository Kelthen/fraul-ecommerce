# Vitrine témoin du mall (plan #109, lot 2) : cadre champagne à petits biseaux et socle en pierre, aux cotes du code.
# Lancer : blender -b -P assets-src/blender/vitrine-temoin.py -- public/models/vitrine.glb   (ou python avec le module bpy)
#
# Repère : origine au sol, au centre de la baie (x = ±3,25 m dans la façade, voir src/walk/views/facades.ts).
# Blender Z vertical, export glTF en Y vertical (three.js : z de la façade = −y de Blender).
# Cotes reprises de facades.ts : ouverture utile 1,45 m, haut 4,20 m (aligné sur la porte), cadre 5 cm de face,
# 8 cm de profondeur, face extérieure à z = +0,46 ; socle 1,35 × 0,14 × 0,70 m centré à z = −0,08.
# Seules les formes sont exportées : les matières (champagne, pierre) sont celles du site, posées par le moteur
# selon le nom de la matière (« Champagne », « Pierre »), pour ne pas doubler les textures.
import bpy, bmesh, sys

out = sys.argv[sys.argv.index("--") + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)

OPEN, TOP = 1.45, 4.20      # ouverture et haut de la vitrine
FACE, DEPTH, ZF = 0.05, 0.08, 0.42  # largeur vue de face, profondeur, axe du cadre (three z)


def mat(name):
    return bpy.data.materials.get(name) or bpy.data.materials.new(name)


def box(name, sx, sy, sz, x, y3, z3, material):
    """Pavé en coordonnées three (x, y vertical, z vers l'allée) → Blender (x, −z, y)."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -z3, y3))
    o = bpy.context.object
    o.name = name
    o.scale = (sx, sz, sy)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(mat(material))
    return o


def cut(target, cutter):
    m = target.modifiers.new("trou", "BOOLEAN")
    m.operation, m.object, m.solver = "DIFFERENCE", cutter, "EXACT"
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(cutter)


def bevel(o, width, segments=3):
    m = o.modifiers.new("biseau", "BEVEL")
    m.width, m.segments, m.limit_method, m.angle_limit = width, segments, "ANGLE", 0.6
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=m.name)
    o.data.shade_smooth_by_angle(angle=0.6) if hasattr(o.data, "shade_smooth_by_angle") else None


def uv(o, size=1.0):
    """UV à l'échelle réelle (1 unité de texture par mètre), pour que le brossé et le grain ne s'étirent pas."""
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.cube_project(cube_size=size)
    bpy.ops.object.mode_set(mode="OBJECT")
    o.select_set(False)


# Cadre : un seul profil fermé (pas de jointures visibles aux angles), haut à 4,20 m comme la porte.
outer_w, inner_w = OPEN + 2 * FACE - 0.01, OPEN - 0.01
cadre = box("Cadre", outer_w, TOP + FACE / 2, DEPTH, 0, (TOP + FACE / 2) / 2, ZF, "Champagne")
cut(cadre, box("trou", inner_w, TOP - FACE, DEPTH + 0.2, 0, FACE + (TOP - FACE) / 2 - FACE / 2, ZF, "Champagne"))
bevel(cadre, 0.007)
# Petite feuillure en retrait derrière le cadre : une deuxième arête qui accroche la lumière, sans épaissir la face.
lip = box("Feuillure", inner_w + 0.004, TOP - FACE + 0.004, 0.03, 0, FACE + (TOP - FACE) / 2 - FACE / 2, ZF - 0.05, "Champagne")
cut(lip, box("trou2", inner_w - 0.024, TOP - FACE - 0.024, 0.2, 0, FACE + (TOP - FACE) / 2 - FACE / 2, ZF - 0.05, "Champagne"))
bevel(lip, 0.003, 2)
bpy.ops.object.select_all(action="DESELECT")
cadre.select_set(True); lip.select_set(True); bpy.context.view_layer.objects.active = cadre
bpy.ops.object.join()
uv(cadre)

# Socle en pierre : corps biseauté posé sur un retrait (ligne d'ombre au sol), même encombrement qu'avant.
corps = box("Socle", OPEN - 0.10, 0.115, 0.70, 0, 0.025 + 0.115 / 2, -0.08, "Pierre")
bevel(corps, 0.012)
pied = box("Pied", OPEN - 0.14, 0.03, 0.66, 0, 0.015, -0.08, "Pierre")
bpy.ops.object.select_all(action="DESELECT")
corps.select_set(True); pied.select_set(True); bpy.context.view_layer.objects.active = corps
bpy.ops.object.join()
uv(corps, 0.5)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True, export_yup=True,
                          export_materials="EXPORT", export_normals=True, use_selection=True)
for o in bpy.context.scene.objects:
    print("OBJET", o.name, len(o.data.polygons), "faces", [round(v, 3) for v in o.dimensions])
