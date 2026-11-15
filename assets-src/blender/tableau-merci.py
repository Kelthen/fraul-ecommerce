# Tableau « Thank you. See you soon. » au-dessus de la porte, côté intérieur (lot Blender de Rhamone, 11 nov.).
# Formes seules : le moteur (côté Serge) pose les matières du site par leur nom et met le texte sur « Tableau_Texte ».
# Lancer :
#   blender -b -P assets-src/blender/tableau-merci.py -- public/models/tableau.glb [apercu.png]
#   (ou python avec le module bpy) ; le 2e chemin, facultatif, rend un aperçu Cycles de la scène de contrôle.
#
# Contrat de livraison (mètres, glTF Y vertical ; repère three.js : x le long du mur, y vers le haut, z vers la pièce)
# Cotes du moteur (src/walk/engine.js, côté porte) : surface du texte 1,50 × 0,394 m, centrée au milieu du bandeau
# au-dessus de la porte (y = DOOR_H + (4,2 − DOOR_H)/2 = 3,80 m). ORIGINE = CENTRE DE LA SURFACE DU TEXTE, face vers +z
# (le moteur la retourne vers l'intérieur comme aujourd'hui). Le dos des pièces est à z = −0,045 : poser l'origine
# à 4,5 cm du mur.
#   Tableau_Texte  rectangle 1,50 × 0,394 m, UV 0..1 (haut de l'image en haut). Matière « Tableau_Texte » : le moteur y
#                  met le canvas actuel (fond ivoire, texte bordeaux), sans éclairage, sans le liseré peint (le cadre le
#                  remplace).
#   Tableau        cadre champagne fin (18 mm de face, arêtes adoucies), fond en retrait qui fait une ombre, et quatre
#                  entretoises en laiton qui le tiennent à 4,5 cm du mur (tableau « flottant », comme en galerie).
#                  Matières « Champagne », « Laiton ».
import bpy, math, sys

argv = sys.argv[sys.argv.index("--") + 1:]
out = argv[0]
preview = argv[1] if len(argv) > 1 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
TW, TH, F, D = 1.50, 0.394, 0.018, 0.022  # texte, face du cadre, profondeur du cadre


def P(x, y, z):
    """three.js (x, y vertical, z vers la pièce) → Blender (x, −z, y)."""
    return (x, -z, y)


def mat(name, rgb, metal=0.0, rough=0.5):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*rgb, 1)
    p.inputs["Metallic"].default_value = metal
    p.inputs["Roughness"].default_value = rough
    return m


CHAMP = mat("Champagne", (0.72, 0.6, 0.42), 0.9, 0.32)
LAITON = mat("Laiton", (0.78, 0.62, 0.36), 1.0, 0.25)
TEXTE = mat("Tableau_Texte", (0.98, 0.97, 0.92), 0.0, 0.8)


def box(name, sx, sy, sz, x, y, z, material, bevel=0.0, seg=2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=P(x, y, z))
    o = bpy.context.object
    o.name = name
    o.scale = (sx, sz, sy)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(material)
    if bevel:
        m = o.modifiers.new("biseau", "BEVEL")
        m.width, m.segments, m.limit_method, m.angle_limit = bevel, seg, "ANGLE", 0.6
        bpy.ops.object.modifier_apply(modifier=m.name)
    return o


def pin(name, x, y):
    """Entretoise : rosace Ø 28 mm contre le mur + tige Ø 10 mm jusqu'au dos du fond."""
    parts = []
    for r, h, z in ((0.014, 0.006, -0.042), (0.005, 0.03, -0.024)):
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=32, location=P(x, y, z), rotation=(math.pi / 2, 0, 0))
        o = bpy.context.object
        o.data.materials.append(LAITON)
        for p in o.data.polygons:
            p.use_smooth = True
        parts.append(o)
    return parts


def join(name, objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = name
    bpy.ops.object.select_all(action="DESELECT")
    return objs[0]


def uv(o, size=1.0):
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.cube_project(cube_size=size)
    bpy.ops.object.mode_set(mode="OBJECT")
    o.select_set(False)


# Cadre : quatre baguettes autour du texte, face 4 mm devant la surface du texte (le texte est en léger retrait).
OW, OH = TW + 2 * F, TH + 2 * F
cadre = [
    box("h", OW, F, D, 0, TH / 2 + F / 2, D / 2 - 0.018, CHAMP, 0.004, 3),
    box("b", OW, F, D, 0, -TH / 2 - F / 2, D / 2 - 0.018, CHAMP, 0.004, 3),
    box("g", F, TH, D, -TW / 2 - F / 2, 0, D / 2 - 0.018, CHAMP, 0.004, 3),
    box("d", F, TH, D, TW / 2 + F / 2, 0, D / 2 - 0.018, CHAMP, 0.004, 3),
    # fond derrière le texte (plaque de 6 mm), un peu plus petit que le cadre : ligne d'ombre au dos
    box("fond", TW + 0.01, TH + 0.01, 0.006, 0, 0, -0.012, CHAMP, 0.001),
]
for sx in (-1, 1):
    for sy in (-1, 1):
        cadre += pin("p", sx * (TW / 2 - 0.12), sy * (TH / 2 - 0.08))
tableau = join("Tableau", cadre)
uv(tableau, 1.0)

bpy.ops.mesh.primitive_plane_add(size=1, location=P(0, 0, -0.0085), rotation=(math.pi / 2, 0, 0))
texte = bpy.context.object
texte.name = "Tableau_Texte"
texte.scale = (TW, TH, 1)
bpy.ops.object.transform_apply(scale=True, rotation=True)
texte.data.materials.append(TEXTE)

bpy.ops.object.select_all(action="DESELECT")
NAMES = ("Tableau", "Tableau_Texte")
for n in NAMES:
    bpy.data.objects[n].select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True, export_yup=True, export_materials="EXPORT",
                          export_normals=True, use_selection=True)
for n in NAMES:
    o = bpy.data.objects[n]
    print("OBJET", n, len(o.data.polygons), "faces", [round(v, 3) for v in o.dimensions])

if preview:
    # Scène de contrôle : bandeau de mur au-dessus d'une porte de 4,80 m, texte peint comme dans le moteur.
    sc = bpy.context.scene
    sc.render.engine, sc.cycles.samples, sc.cycles.device = "CYCLES", 48, "CPU"
    sc.render.resolution_x, sc.render.resolution_y = 1400, 700
    for o in (tableau, texte):
        o.location = P(0, 3.8, 0.045)
    img = bpy.data.images.new("txt", 1200, 315)
    W_, H_ = 1200, 315
    px = [0.0] * (W_ * H_ * 4)
    for i in range(W_ * H_):
        px[4 * i:4 * i + 4] = (0.98, 0.97, 0.92, 1)
    img.pixels = px
    tn = TEXTE.node_tree
    t = tn.nodes.new("ShaderNodeTexImage"); t.image = img
    tn.links.new(t.outputs["Color"], tn.nodes["Principled BSDF"].inputs["Base Color"])
    # texte en 3D bordeaux posé sur la surface (seulement pour l'aperçu)
    for line, y in (("Thank you.", 3.87), ("See you soon.", 3.73)):
        bpy.ops.object.text_add(location=P(0, y, 0.0375), rotation=(math.pi / 2, 0, 0))
        tx = bpy.context.object; tx.data.body = line; tx.data.align_x = "CENTER"; tx.data.align_y = "CENTER"
        tx.data.size = 0.095; tx.data.materials.append(mat("Bordeaux", (0.38, 0.0, 0.02), 0, 0.6))
    mur = mat("Mur", (0.62, 0.58, 0.52), 0, 0.9)
    box("mur1", 12, 0.8, 0.02, 0, 3.8, -0.01, mur)
    for sx in (-1, 1):
        box("mur2", 3.6, 3.4, 0.02, sx * 4.2, 1.7, -0.01, mur)
    box("jambe", 4.92, 0.06, 0.06, 0, 3.43, 0.0, CHAMP)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = P(0.9, 2.2, 4.2); cam.data.lens = 50
    tgt = bpy.data.objects.new("t", None); tgt.location = P(0, 3.5, 0); sc.collection.objects.link(tgt)
    cam.constraints.new("TRACK_TO").target = tgt
    for loc, e in ((P(-1.5, 2.5, 2.5), 60), (P(2.5, 3.0, 2.0), 25)):
        l = bpy.data.objects.new("lum", bpy.data.lights.new("lum", "AREA")); l.data.energy = e; l.data.size = 1.5
        l.location = loc; sc.collection.objects.link(l); l.constraints.new("TRACK_TO").target = tgt
    sc.world = bpy.data.worlds.new("w"); sc.world.color = (0.12, 0.115, 0.11)
    sc.render.filepath = preview
    bpy.ops.render.render(write_still=True)
