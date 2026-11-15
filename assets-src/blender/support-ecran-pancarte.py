# Côté porte de la boutique (lot Blender de Rhamone, 11 nov.) : le cadre de l'écran mural des looks et la pancarte
# sur pied. Formes seules : le moteur (côté Serge) pose les matières du site par leur nom et place chaque pièce. Lancer :
#   blender -b -P assets-src/blender/support-ecran-pancarte.py -- public/models/cote-porte.glb [apercu.png]
#   (ou python avec le module bpy) ; le 2e chemin, facultatif, rend un aperçu Cycles de la scène de contrôle.
#
# Contrat de livraison (mètres, glTF Y vertical ; repère three.js : x le long du mur, y vers le haut, z vers la pièce)
# Écran (src/walk/engine.js, côté porte) : surface H = DOOR_H − 0,06 = 3,34 m, largeur W = H × ratio de la photo,
# bas à 0,03 m du sol, encastré dans le pan de mur à gauche de la porte. Le cadre se monte en 4 morceaux + 1 seuil,
# pour suivre W sans déformer les angles :
#   Ecran_Montant   montant vertical, hauteur H + 2 × 0,022 (coins compris), face 22 mm. Origine au centre.
#                   Deux, à x = ±(W/2 + 0,011), y = 0,03 + H/2. Face noire brillante « Ecran_Noir », filet extérieur
#                   « Champagne » de 6 mm en retrait (l'arête qui accroche la lumière).
#   Ecran_Traverse  traverse horizontale, LONGUEUR 1 m le long de x, origine au centre : étirer en x à W.
#                   Deux, à y = 0,03 − 0,011 et y = 0,03 + H + 0,011. Mêmes matières.
#   Ecran_Seuil     tablette champagne au pied de l'écran (1 m le long de x, étirer à W + 0,044), 3 cm de haut,
#                   6 cm de saillie. Origine au sol, au centre, contre le mur. Pose l'écran au lieu de le faire flotter.
#   L'écran lui-même (la photo) reste dessiné par le moteur, 16 mm devant le mur comme aujourd'hui.
# Pancarte sur pied (promotions ; affichée seulement quand il y aura une vraie source de promotions, décision du 9 nov.) :
#   Pancarte        pied champagne : socle rond Ø 0,36 m lesté, mât Ø 20 mm, porte-affiche à cadre fin.
#                   Origine au sol, au centre du socle ; l'affiche regarde +z. Hauteur totale 1,46 m.
#   Pancarte_Affiche  rectangle 0,50 × 0,707 m (format A, portrait), UV 0..1 sur la face avant, centre à y = 1,08.
#                   Matière « Affiche » : le moteur y met la texture de la promotion (canvas), sans éclairage.
import bpy, math, sys

argv = sys.argv[sys.argv.index("--") + 1:]
out = argv[0]
preview = argv[1] if len(argv) > 1 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
H, B = 3.34, 0.022           # hauteur de l'écran, largeur vue de face du cadre
AW, AH, AY = 0.50, 0.707, 1.08  # affiche de la pancarte


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
NOIR = mat("Ecran_Noir", (0.012, 0.012, 0.014), 0.3, 0.12)
AFFICHE = mat("Affiche", (0.92, 0.88, 0.8), 0.0, 0.7)


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


def cyl(name, r, h, x, y, z, material, verts=48, bevel=0.0):
    """Cylindre vertical (axe y three), centré en (x, y, z)."""
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=verts, location=P(x, y, z))
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    if bevel:
        m = o.modifiers.new("biseau", "BEVEL")
        m.width, m.segments, m.limit_method, m.angle_limit = bevel, 3, "ANGLE", 0.6
        bpy.ops.object.modifier_apply(modifier=m.name)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


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


# --- Cadre de l'écran : face noire de 22 mm, 2 cm devant le mur ; un filet champagne de 6 mm en retrait sur chaque
# arête longue (le même morceau sert des deux côtés, donc filet des deux côtés : symétrique).
D, F = 0.02, 0.006
def piece(name, sx, sy, vertical):
    parts = [box("f", sx, sy, D, 0, 0, D / 2, NOIR, 0.003)]
    for sd in (-1, 1):
        if vertical:
            parts.append(box("c", F, sy, D - F, sd * (sx / 2 + F / 2 - 0.002), 0, (D - F) / 2, CHAMP, 0.002))
        else:
            parts.append(box("c", sx, F, D - F, 0, sd * (sy / 2 + F / 2 - 0.002), (D - F) / 2, CHAMP, 0.002))
    o = join(name, parts)
    uv(o, 1.0)
    return o


montant = piece("Ecran_Montant", B, H + 2 * B, True)
traverse = piece("Ecran_Traverse", 1.0, B, False)
seuil = box("Ecran_Seuil", 1.0, 0.03, 0.06, 0, 0.015, 0.03, CHAMP, 0.004, 3)
uv(seuil, 1.0)

# --- Pancarte sur pied : socle lesté (disque + gorge), mât, porte-affiche à cadre fin et clips.
socle = join("Pancarte", [
    cyl("s1", 0.18, 0.016, 0, 0.008, 0, CHAMP, 64, 0.004),
    cyl("s2", 0.165, 0.008, 0, 0.02, 0, CHAMP, 64, 0.003),
    cyl("s3", 0.03, 0.03, 0, 0.039, 0, CHAMP, 32, 0.004),          # collerette
    cyl("mat", 0.01, AY - AH / 2 - 0.05, 0, 0.05 + (AY - AH / 2 - 0.05) / 2, 0, CHAMP, 24),
    box("dos", 0.06, AH * 0.8, 0.012, 0, AY, -0.012, CHAMP, 0.003),  # plaque de fixation derrière l'affiche
    # cadre fin (10 mm de face) autour de l'affiche, 1 cm d'épaisseur
    box("ch", AW + 0.02, 0.01, 0.012, 0, AY + AH / 2 + 0.005, 0, CHAMP, 0.002),
    box("cb", AW + 0.02, 0.01, 0.012, 0, AY - AH / 2 - 0.005, 0, CHAMP, 0.002),
    box("cg", 0.01, AH, 0.012, -AW / 2 - 0.005, AY, 0, CHAMP, 0.002),
    box("cd", 0.01, AH, 0.012, AW / 2 + 0.005, AY, 0, CHAMP, 0.002),
    box("bas", 0.05, 0.03, 0.02, 0, AY - AH / 2 - 0.02, -0.004, CHAMP, 0.003),  # pince du bas sur le mât
])
uv(socle, 0.5)
bpy.ops.mesh.primitive_plane_add(size=1, location=P(0, AY, 0.0005), rotation=(math.pi / 2, 0, 0))
affiche = bpy.context.object
affiche.name = "Pancarte_Affiche"
affiche.scale = (AW, AH, 1)
bpy.ops.object.transform_apply(scale=True, rotation=True)
affiche.data.materials.append(AFFICHE)  # UV du plan par défaut : 0..1, haut de l'image en haut

# Export : seulement les pièces du contrat.
bpy.ops.object.select_all(action="DESELECT")
NAMES = ("Ecran_Montant", "Ecran_Traverse", "Ecran_Seuil", "Pancarte", "Pancarte_Affiche")
for n in NAMES:
    bpy.data.objects[n].select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True, export_yup=True, export_materials="EXPORT",
                          export_normals=True, use_selection=True)
for n in NAMES:
    o = bpy.data.objects[n]
    print("OBJET", n, len(o.data.polygons), "faces", [round(v, 3) for v in o.dimensions])

if preview:
    # Scène de contrôle (non exportée) : pan de mur clair, écran au ratio 2/3 monté avec ses pièces, pancarte devant.
    sc = bpy.context.scene
    sc.render.engine, sc.cycles.samples, sc.cycles.device = "CYCLES", 48, "CPU"
    sc.render.resolution_x, sc.render.resolution_y = 1000, 1200
    W, CX = H * 2 / 3, 0.0

    def place(o, x, y, z, sx=1.0):
        c = o.copy(); c.data = o.data; c.location = P(x, y, z); c.scale.x = sx; sc.collection.objects.link(c)

    for sd in (-1, 1):
        place(montant, CX + sd * (W / 2 + B / 2), 0.03 + H / 2, 0)
    place(traverse, CX, 0.03 - B / 2, 0, W)
    place(traverse, CX, 0.03 + H + B / 2, 0, W)
    place(seuil, CX, 0, 0, W + 2 * B)
    place(socle, CX + 1.9, 0, 0.9)
    place(affiche, CX + 1.9, 0, 0.9)
    for o in (montant, traverse, seuil, socle, affiche):
        o.hide_render = True
    bpy.ops.mesh.primitive_plane_add(size=1, location=P(CX, 0.03 + H / 2, 0.016), rotation=(math.pi / 2, 0, 0))
    ecran = bpy.context.object; ecran.scale = (W, H, 1)
    em = bpy.data.materials.new("photo"); em.use_nodes = True
    em.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.30, 0.27, 0.25, 1)
    ecran.data.materials.append(em)
    bpy.ops.mesh.primitive_plane_add(size=8, location=P(0, 2, -0.001), rotation=(math.pi / 2, 0, 0))
    bpy.context.object.data.materials.append(mat("Mur", (0.62, 0.58, 0.52), 0, 0.9))
    bpy.ops.mesh.primitive_plane_add(size=8, location=P(0, 0, 4))
    bpy.context.object.data.materials.append(mat("Sol", (0.86, 0.83, 0.77), 0, 0.35))
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = P(1.6, 1.6, 5.2); cam.data.lens = 30
    tgt = bpy.data.objects.new("t", None); tgt.location = P(0.5, 1.6, 0); sc.collection.objects.link(tgt)
    cam.constraints.new("TRACK_TO").target = tgt
    for loc, e in ((P(-1.5, 3.5, 3.0), 90), (P(3.0, 2.0, 2.5), 35)):
        l = bpy.data.objects.new("lum", bpy.data.lights.new("lum", "AREA")); l.data.energy = e; l.data.size = 2.0
        l.location = loc; sc.collection.objects.link(l); l.constraints.new("TRACK_TO").target = tgt
    sc.world = bpy.data.worlds.new("w"); sc.world.color = (0.12, 0.115, 0.11)
    sc.render.filepath = preview
    bpy.ops.render.render(write_still=True)
