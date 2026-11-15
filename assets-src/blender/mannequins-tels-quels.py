# Mannequins de vitrine : les prototypes ivoire de ChatGPT TELS QUELS (choix de Rhamone, 15 nov. 2026 : « tels quels,
# tout ivoire »). Sources : branche feat/gpt/sources-mannequins-3d, assets-src/models/prototypes-ivoire/{homme,femme}-prototype.glb.
#
#   python assets-src/blender/mannequins-tels-quels.py -- homme <homme-prototype.glb> sortie.glb [socle.glb]
#   python assets-src/blender/mannequins-tels-quels.py -- femme <femme-prototype.glb> sortie.glb [socle.glb]
#
# Seulement des déplacements du modèle entier, aucune déformation : tourné face à l'allée (le prototype regarde +x),
# centré, pieds posés sur le socle du mannequin actuel (Socle_Plaque, Socle_Tige). Pas de squelette, pas de pose,
# pas de découpe en zones : une seule matière, « Mannequin_Blanc_Laque », que le Walk rend en laque ivoire
# (src/walk/engine.js, blenderMannequin). La forme garde toutes ses faces. Ancienne version avec couleurs et pose :
# assets-src/blender/mannequins-ivoire.py (abandonnée : découpe et pose créaient des défauts).
import bpy, sys, math
from mathutils import Matrix

a = sys.argv[sys.argv.index("--") + 1:]
KIND, SRC, OUT = a[0], a[1], a[2]
SOCLE = a[3] if len(a) > 3 else None

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
body = [o for o in bpy.data.objects if o.type == "MESH"][0]
body.name = "Mannequin_Corps"
bpy.context.view_layer.objects.active = body
body.select_set(True)
bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in list(bpy.data.objects):
    if o is not body:
        bpy.data.objects.remove(o)
body.data.transform(Matrix.Rotation(math.radians(-90), 4, "Z"))  # face à −y, comme les mannequins du site

plate_top = 0.0
if SOCLE:
    bpy.ops.import_scene.gltf(filepath=SOCLE)
    for o in list(bpy.data.objects):
        if o.type == "MESH" and o is not body and not o.name.startswith("Socle"):
            bpy.data.objects.remove(o)
    plate = bpy.data.objects.get("Socle_Plaque")
    if plate:
        plate_top = max((plate.matrix_world @ v.co).z for v in plate.data.vertices)
V = [v.co for v in body.data.vertices]
z0 = min(v.z for v in V)
cx = (min(v.x for v in V) + max(v.x for v in V)) / 2
cy = (min(v.y for v in V) + max(v.y for v in V)) / 2
for v in body.data.vertices:
    v.co.x -= cx
    v.co.y -= cy
    v.co.z += plate_top - z0

old = bpy.data.materials.get("Mannequin_Blanc_Laque")
if old:
    old.name = "Mannequin_Blanc_Laque_import"
m = bpy.data.materials.new("Mannequin_Blanc_Laque")
m.use_nodes = True
m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.94, 0.92, 0.89, 1)
body.data.materials.clear()
body.data.materials.append(m)
for p in body.data.polygons:
    p.use_smooth = True

# Ombre des creux inscrite dans les sommets (couleur de sommet « Creux ») : plis du tee, poches, muscles restent lisibles
# même sous l'éclairage plat du mall, sans lampe de plus au téléphone. La forme ne change pas.
import bmesh
bm = bmesh.new(); bm.from_mesh(body.data); bm.verts.ensure_lookup_table(); bm.normal_update()
cav = []
for v in bm.verts:  # creux : les voisins remontent au-dessus du plan du sommet (côté de sa normale)
    nb = [e.other_vert(v) for e in v.link_edges]
    c = sum(((w.co - v.co).normalized().dot(v.normal) for w in nb), 0.0) / max(1, len(nb)) if nb else 0.0
    cav.append(max(0.0, c))
for _ in range(3):  # lissage : une ombre douce, pas du bruit
    cav = [(cav[v.index] + sum(cav[e.other_vert(v).index] for e in v.link_edges)) / (1 + len(v.link_edges)) for v in bm.verts]
top = sorted(cav)[int(len(cav) * 0.98)] or 1.0
shade = [1.0 - 0.45 * min(1.0, c / top) for c in cav]  # jusqu'à 45 % plus sombre au fond des plis
bm.free()
col = body.data.color_attributes.new("Creux", "BYTE_COLOR", "POINT")
for i, s_ in enumerate(shade):
    col.data[i].color = (s_, s_, s_, 1.0)
body.data.color_attributes.active_color = col
body.data.color_attributes.render_color_index = body.data.color_attributes.active_color_index

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_yup=True, export_materials="EXPORT",
                          export_normals=True, export_vertex_color="ACTIVE")
bpy.ops.wm.save_as_mainfile(filepath=OUT.rsplit(".", 1)[0] + ".blend", compress=True)
H = max(v.co.z for v in body.data.vertices) - plate_top
print("HAUTEUR", round(H, 3), "FACES", len(body.data.polygons))
