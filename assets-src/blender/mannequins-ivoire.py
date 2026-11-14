# Mannequins de vitrine réalistes, à partir des prototypes ivoire de ChatGPT (branche feat/gpt/sources-mannequins-3d,
# assets-src/models/prototypes-ivoire/{homme,femme}-prototype.glb ; docs/ETAT-MANNEQUINS-3D.md). Rhamone, 14 nov. :
# « utilise un vrai mannequin… clone-le en 3D », poses validées (homme détendu, femme main sur la hanche).
#
#   python assets-src/blender/mannequins-ivoire.py -- homme <homme-prototype.glb> sortie.glb [socle.glb]
#   python assets-src/blender/mannequins-ivoire.py -- femme <femme-prototype.glb> sortie.glb [socle.glb]
#
# 1. Remis face à −y (le prototype regarde +x), pieds posés sur le socle du mannequin actuel (Socle_Plaque, Socle_Tige).
# 2. Squelette simple, poids automatiques ; chaque face est classée par l'os qui la porte et sa hauteur pour retrouver
#    les matières que le Walk connaît (src/walk/engine.js, blenderMannequin) : Mannequin_Blanc_Laque (peau),
#    Tee_Noir (tee, mis à la couleur de la marque), Jean_Noir_Delave (pantalon), Basket_Blanc (chaussures).
# 3. Pose statique (pas d'animation), puis allègement (≈ 24 000 faces, sans textures : le Walk colore par matière).
import bpy, sys, math
from mathutils import Vector

a = sys.argv[sys.argv.index("--") + 1:]
KIND, SRC, OUT = a[0], a[1], a[2]
SOCLE = a[3] if len(a) > 3 else None
# Hauteurs des coutures, en fraction de la taille (mesurées sur les rendus de contrôle des prototypes).
CUTS = {
    "homme": dict(neck=0.85, sleeve=0.71, hem=0.52, trouser=0.06),
    "femme": dict(neck=0.845, sleeve=0.725, hem=0.57, trouser=0.08),
}[KIND]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
body = [o for o in bpy.data.objects if o.type == "MESH"][0]
body.name = "Mannequin_Corps"
bpy.context.view_layer.objects.active = body
body.select_set(True)
bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
# Face à −y comme les mannequins du site (le prototype regarde +x) : rotation appliquée aux sommets eux-mêmes.
from mathutils import Matrix
body.data.transform(Matrix.Rotation(math.radians(-90), 4, "Z"))
# Le maillage généré est fait de morceaux cousus le long des coutures de texture : on les soude, sinon chaque
# morceau prend des poids différents et le corps se déchire à la pose.
import bmesh
bm = bmesh.new(); bm.from_mesh(body.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0008)
bm.to_mesh(body.data); bm.free()

plate_top = 0.0
if SOCLE:  # socle du mannequin actuel : plaque + tige, inchangés
    bpy.ops.import_scene.gltf(filepath=SOCLE)
    for o in list(bpy.data.objects):
        if o.type == "MESH" and o is not body and not o.name.startswith("Socle"):
            bpy.data.objects.remove(o)
    plate = bpy.data.objects.get("Socle_Plaque")
    if plate:
        plate_top = max((plate.matrix_world @ v.co).z for v in plate.data.vertices)
V = [v.co.copy() for v in body.data.vertices]
z0 = min(v.z for v in V)
H = max(v.z for v in V) - z0
cx = (min(v.x for v in V) + max(v.x for v in V)) / 2
cy = (min(v.y for v in V) + max(v.y for v in V)) / 2
for v in body.data.vertices:
    v.co.x -= cx
    v.co.y -= cy
    v.co.z += plate_top - z0
V = [v.co.copy() for v in body.data.vertices]
Z = lambda f: plate_top + f * H


def clusters(f, dz=0.008):
    """Sections du corps à la hauteur f : groupes le long de x, avec leur centre (x, y)."""
    s = sorted((v for v in V if abs(v.z - Z(f)) < dz), key=lambda v: v.x)
    out, cur = [], [s[0]]
    for v in s[1:]:
        if v.x - cur[-1].x > 0.02:
            out.append(cur)
            cur = [v]
        else:
            cur.append(v)
    out.append(cur)
    return [Vector((sum(v.x for v in c) / len(c), sum(v.y for v in c) / len(c), Z(f))) for c in out]


def side(f, s):
    """Centre du membre le plus à l'extérieur du côté s (+1 : gauche du personnage, x > 0)."""
    c = clusters(f)
    return max(c, key=lambda p: p.x) if s > 0 else min(c, key=lambda p: p.x)


# --- Squelette
bpy.ops.object.armature_add(location=(0, 0, 0))
arm = bpy.context.object
arm.name = "Squelette"
bpy.ops.object.mode_set(mode="EDIT")
eb = arm.data.edit_bones
eb.remove(eb[0])


def bone(name, head, tail, parent=None):
    b = eb.new(name)
    b.head, b.tail = Vector(head), Vector(tail)
    if parent:
        b.parent = eb[parent]
        b.use_connect = (b.parent.tail - b.head).length < 1e-4
    return b


yc = sum(v.y for v in V if abs(v.z - Z(0.65)) < 0.01 and abs(v.x) < 0.1) / max(1, sum(1 for v in V if abs(v.z - Z(0.65)) < 0.01 and abs(v.x) < 0.1))
bone("Bassin", (0, yc, Z(0.47)), (0, yc, Z(0.58)))
bone("Dos", (0, yc, Z(0.58)), (0, yc, Z(0.78)), "Bassin")
bone("Tete", (0, yc, Z(0.78)), (0, yc, Z(1.0)), "Dos")
for s, nm in ((1, "G"), (-1, "D")):
    sh = Vector((0.19 * s * H / 1.8, yc, Z(0.795)))
    el = side(0.6, s)
    wr = side(0.48, s)
    hand = side(0.42, s)
    bone(f"Epaule_{nm}", (0.05 * s, yc, Z(0.79)), sh, "Dos")
    bone(f"Bras_{nm}", sh, el, f"Epaule_{nm}")
    bone(f"AvantBras_{nm}", el, wr, f"Bras_{nm}")
    bone(f"Main_{nm}", wr, hand, f"AvantBras_{nm}")
    hip = Vector((0.09 * s * H / 1.8, yc, Z(0.5)))
    legs = [p for p in clusters(0.28) if p.x * s > 0] or [hip]
    kn = max(legs, key=lambda p: p.x * s)
    feet = [p for p in clusters(0.05) if p.x * s > 0] or [kn]
    an = max(feet, key=lambda p: p.x * s)
    an.z = Z(0.05)
    bone(f"Cuisse_{nm}", hip, kn, "Bassin")
    bone(f"Tibia_{nm}", kn, an, f"Cuisse_{nm}")
bpy.ops.object.mode_set(mode="OBJECT")

bpy.ops.object.select_all(action="DESELECT")
body.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type="ARMATURE_AUTO")

# --- Matières par zone (os dominant + hauteur des coutures)
mats = {}
for name, rgb in (("Mannequin_Blanc_Laque", (0.95, 0.94, 0.92)), ("Tee_Noir", (0.05, 0.05, 0.05)),
                  ("Jean_Noir_Delave", (0.16, 0.17, 0.2)), ("Basket_Blanc", (0.96, 0.96, 0.94))):
    old = bpy.data.materials.get(name)  # matière du même nom venue avec le socle importé : on la libère
    if old:
        old.name = name + "_import"
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True  # couleur de base exportée dans le glTF : 4 matières distinctes (sinon fusionnées à l'allègement)
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*rgb, 1)
    mats[name] = m
body.data.materials.clear()
for m in mats.values():
    body.data.materials.append(m)
idx = {n: i for i, n in enumerate(mats)}
# Bras = sections séparées du buste (pose de travail bras écartés), repérées tous les centimètres ; au-dessus de
# l'aisselle, bras et buste se touchent : c'est la manche, donc le tee.
band = {}
for k in range(int(Z(0.0) * 100), int(Z(1.0) * 100) + 1):
    zz = k / 100
    xs = sorted(v.x for v in V if abs(v.z - zz) < 0.006)
    if not xs:
        continue
    groups, cur = [], [xs[0], xs[0]]
    for x in xs[1:]:
        if x - cur[1] > 0.03:
            groups.append(cur); cur = [x, x]
        else:
            cur[1] = x
    groups.append(cur)
    band[k] = groups


def is_arm(c):
    g = band.get(round(c.z * 100))
    if not g or len(g) < 3 or c.z < Z(0.4):
        return False
    return c.x < g[0][1] + 0.005 or c.x > g[-1][0] - 0.005  # premier ou dernier groupe le long de x


gname = {g.index: g.name for g in body.vertex_groups}
dom = []
for v in body.data.vertices:
    best = max(v.groups, key=lambda g: g.weight, default=None)
    dom.append(gname.get(best.group, "Dos") if best else "Dos")


def zone(p):
    c = sum((V[i] for i in p.vertices), Vector()) / len(p.vertices)
    bones = [dom[i] for i in p.vertices]
    b = max(set(bones), key=bones.count)
    if c.z < Z(CUTS["trouser"]):
        return "Basket_Blanc"
    # Os du bras sous la manche : peau si la face est loin de l'axe du corps (le bras pend à côté du buste) ou
    # plus bas que l'ourlet du tee (mains) ; sinon c'est le flanc du tee que l'avant-bras touchait.
    if b.startswith(("Bras", "AvantBras", "Main")) and c.z < Z(CUTS["sleeve"]):
        if abs(c.x) > 0.15 * H / 1.8 or c.z < Z(CUTS["hem"]) or b.startswith("Main"):
            return "Mannequin_Blanc_Laque"
    if b.startswith(("Cuisse", "Tibia")) or c.z < Z(CUTS["hem"]):
        return "Jean_Noir_Delave"
    if c.z > Z(CUTS["neck"]) or b == "Tete":
        return "Mannequin_Blanc_Laque"
    return "Tee_Noir"


lab = [zone(p) for p in body.data.polygons]
# Lissage : une face prend la matière majoritaire de ses voisines (bords nets, plus de taches isolées).
import bmesh
bm = bmesh.new(); bm.from_mesh(body.data); bm.faces.ensure_lookup_table()
for _ in range(3):
    new = lab[:]
    for f in bm.faces:
        nb = [lab[o.index] for e in f.edges for o in e.link_faces if o.index != f.index]
        if nb:
            best = max(set(nb), key=nb.count)
            if nb.count(best) * 2 > len(nb) and best != lab[f.index]:
                new[f.index] = best
    lab = new
bm.free()
for p, m in zip(body.data.polygons, lab):
    p.material_index = idx[m]

# --- Pose
P = arm.pose.bones


def rot(name, x=0, y=0, z=0):
    pb = P[name]
    pb.rotation_mode = "XYZ"
    pb.rotation_euler = (math.radians(x), math.radians(y), math.radians(z))


if KIND == "femme":
    waist = max(-v.x for v in V if abs(v.z - Z(0.6)) < 0.01 and -0.2 < v.x < 0)
    tgt = bpy.data.objects.new("cible", None)
    tgt.location = (-(waist + 0.015), yc + 0.01, Z(0.58))
    pole = bpy.data.objects.new("pole", None)
    pole.location = (-0.75, yc + 0.25, Z(0.68))
    for o in (tgt, pole):
        bpy.context.scene.collection.objects.link(o)
    ik = P["AvantBras_D"].constraints.new("IK")
    ik.target, ik.pole_target, ik.chain_count, ik.pole_angle = tgt, pole, 2, 0.0
    rot("Main_D", x=-10, z=-25)
    rot("Bras_G", z=float(__import__("os").environ.get("ADD", "8")))
    rot("Bassin", y=4)
    rot("Dos", y=-5)
    LEG = float(__import__("os").environ.get("LEG", "7"))
    rot("Cuisse_G", x=-5, z=LEG)
    rot("Tibia_G", x=8, z=-LEG * 0.5)
    rot("Cuisse_D", z=-LEG)
    rot("Tibia_D", z=LEG * 0.5)
else:
    ad = float(__import__("os").environ.get("ADD", "8"))
    rot("Bras_G", z=ad)
    rot("Bras_D", z=-ad)
    rot("AvantBras_G", x=-8)
    rot("AvantBras_D", x=-10)
    rot("Bassin", y=2, z=3)
    rot("Dos", y=-2, z=-4)
    LEG = float(__import__("os").environ.get("LEG", "7"))
    rot("Cuisse_G", x=-2, z=LEG)
    rot("Tibia_G", x=4, z=-LEG * 0.5)
    rot("Cuisse_D", z=-LEG)
    rot("Tibia_D", z=LEG * 0.5)
bpy.context.view_layer.update()

bpy.context.view_layer.objects.active = body
for m in list(body.modifiers):
    if m.type == "ARMATURE":
        bpy.ops.object.modifier_apply(modifier=m.name)
body.parent = None
body.vertex_groups.clear()
for o in list(bpy.data.objects):
    if o.type in ("ARMATURE", "EMPTY"):
        bpy.data.objects.remove(o)
# Pieds sur la plaque après la pose.
low = min((body.matrix_world @ v.co).z for v in body.data.vertices)
body.location.z += plate_top - low
# Allègement : ≈ 24 000 faces.
dec = body.modifiers.new("allege", "DECIMATE")
dec.ratio = min(1.0, 24000 / len(body.data.polygons))
bpy.ops.object.modifier_apply(modifier=dec.name)
for p in body.data.polygons:
    p.use_smooth = True

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_yup=True, export_materials="EXPORT", export_normals=True)
xs = [(body.matrix_world @ v.co).x for v in body.data.vertices]
print("LARGEUR", round(max(xs) - min(xs), 3), "HAUTEUR", round(H, 3), "FACES", len(body.data.polygons))
