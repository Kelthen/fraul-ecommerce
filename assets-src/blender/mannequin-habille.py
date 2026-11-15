# Mannequin habillé d'un vrai look (Rhamone, 14 nov. : « utiliser face et dos de chaque look, conserver coiffure,
# vêtements et chaussures »). Prototype : les photos face et dos du look (feat/gpt/looks-face-dos) sont projetées sur
# le mannequin réaliste posé (assets-src/blender/mannequins-ivoire.py) : la face sur l'avant du corps, le dos sur
# l'arrière, à l'échelle (sommet de la tête → semelles). Une seule matière texturée « Look_<n> ».
#
#   python assets-src/blender/mannequin-habille.py -- <mannequin posé.glb> <atlas.jpg> <boîtes> <n> sortie.glb
#   <boîtes> = "haut,bas,gauche,droite;haut,bas,gauche,droite" : silhouette (px) de la face puis du dos dans leur photo
#   (rembg), <atlas> = face à gauche, dos à droite, même taille de photo (largeur totale 2 × W).
# Limites : une projection, pas une vraie reconstruction ; les côtés sont étirés et la pose doit ressembler à celle
# de la photo (bras le long du corps).
import bpy, sys
from mathutils import Vector

a = sys.argv[sys.argv.index("--") + 1:]
SRC, ATLAS, BOXES, N, OUT = a[0], a[1], a[2], a[3], a[4]
PW, PH = 768, 1024  # taille d'une photo (face ou dos) dans l'atlas d'origine
boxes = [tuple(float(x) for x in b.split(",")) for b in BOXES.split(";")]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
body = next(o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith("Socle"))
bpy.context.view_layer.objects.active = body
mw = body.matrix_world
P = [mw @ v.co for v in body.data.vertices]
ztop = max(p.z for p in P)
zbot = min(p.z for p in P)
hm = ztop - zbot

img = bpy.data.images.load(ATLAS)
mat = bpy.data.materials.new(f"Look_{N}")
mat.use_nodes = True
tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
tex.image = img
bsdf = mat.node_tree.nodes["Principled BSDF"]
mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
bsdf.inputs["Roughness"].default_value = 0.8
body.data.materials.clear()
body.data.materials.append(mat)

uv = body.data.uv_layers.new(name="look") if not body.data.uv_layers else body.data.uv_layers[0]
uv_data = body.data.uv_layers.active.data
nm = body.matrix_world.to_3x3()
for poly in body.data.polygons:
    poly.material_index = 0
    back = (nm @ poly.normal).y > 0  # le mannequin regarde −y : normale vers +y = dos
    top, bot, left, right = boxes[1 if back else 0]
    s = (bot - top) / hm  # pixels par mètre
    cx = (left + right) / 2
    for li in poly.loop_indices:
        p = P[body.data.loops[li].vertex_index]
        px = cx + (-p.x if back else p.x) * s
        py = top + (ztop - p.z) * s
        u = (px / PW) * 0.5 + (0.5 if back else 0.0)
        uv_data[li].uv = (u, 1 - py / PH)

for o in list(bpy.data.objects):  # le socle garde sa matière ; on garde tout le reste tel quel
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_yup=True, export_materials="EXPORT",
                          export_normals=True, export_image_format="JPEG", export_jpeg_quality=60)
# La photo n'est pas dans le .glb (le site refuse les images internes « blob: », règles CSP) : copier l'atlas à côté,
# public/models/mannequin-look-<n>.jpg ; le Walk la charge lui-même (src/walk/engine.js, matières « Look_<n> »).
print("HABILLE", N, "faces", len(body.data.polygons))
