# Mannequins de vitrine réalistes, à partir des prototypes ivoire de ChatGPT (branche feat/gpt/sources-mannequins-3d,
# assets-src/models/prototypes-ivoire/{homme,femme}-prototype.glb ; docs/ETAT-MANNEQUINS-3D.md). Rhamone, 14 nov. :
# « utilise un vrai mannequin… clone-le en 3D », poses validées (homme détendu, femme main sur la hanche).
#
#   python assets-src/blender/mannequins-ivoire.py -- homme <homme-prototype.glb> sortie.glb [socle.glb]
#   python assets-src/blender/mannequins-ivoire.py -- femme <femme-prototype.glb> sortie.glb [socle.glb]
#
# 1. Remis face à −y (le prototype regarde +x), morceaux soudés, allégé (≈ 24 000 faces), pieds sur le socle actuel.
# 2. Coutures : le maillage est coupé le long du col, du bas du tee, des ourlets de manche et du bas du jean (plans
#    réglés sur les gros plans de contrôle), puis chaque face reçoit une des matières que le Walk connaît
#    (src/walk/engine.js, blenderMannequin) : Mannequin_Blanc_Laque (peau), Tee_Noir (tee, mis à la couleur de la
#    marque), Jean_Noir_Delave (pantalon), Basket_Blanc (chaussures). Sans texture : le Walk colore par matière.
# 3. Squelette simple, poids automatiques (le cœur du buste ne suit pas le bras), pose de la référence A
#    (assets-src/references/mannequins-3d/poses-reference-validee.png sur feat/gpt/sources-mannequins-3d) :
#    homme main droite dans la poche avant, femme main droite posée sur le côté de la hanche.
# Sorties : sortie.glb (statique, pour le site), sortie-rig.blend (scène de travail : squelette, poids, cibles de
# pose encore modifiables), sortie-pose.blend (pose figée, comme le GLB).
# Réglages par variables d'environnement (essais) : MAIN, CIBLE, POCHE, ADD, LEG, SOUDURE, POSE=libre, NOIK, BRUT.
import bpy, sys, math
from mathutils import Vector

a = sys.argv[sys.argv.index("--") + 1:]
KIND, SRC, OUT = a[0], a[1], a[2]
SOCLE = a[3] if len(a) > 3 else None
# Hauteurs des coutures, en fraction de la taille (mesurées sur les rendus de contrôle des prototypes).
CUTS = {
    "homme": dict(neck=0.85, sleeve=0.697, hem=0.52, trouser=0.06),
    "femme": dict(neck=0.845, sleeve=0.722, hem=0.57, trouser=0.08),
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
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=float(__import__("os").environ.get("SOUDURE", "0.0025")))
bm.to_mesh(body.data); bm.free()
# Allègement (≈ 24 000 faces) avant le découpage en matières : les coutures tombent sur les faces finales et
# restent nettes (allégé après coup, chaque bord de matière se faisait mâcher en dents de scie).
bpy.context.view_layer.objects.active = body
dec = body.modifiers.new("allege", "DECIMATE")
dec.ratio = min(1.0, 24000 / len(body.data.polygons))
bpy.ops.object.modifier_apply(modifier=dec.name)
# L'allègement laisse quelques triangles retournés (petits plis en zigzag, ex. poitrine de l'homme) : on repère les
# faces dont la normale s'oppose à celle de leurs voisines et on lisse leurs sommets, rien d'autre.
bm = bmesh.new(); bm.from_mesh(body.data); bm.normal_update()
for _ in range(4):
    bad = set()
    for f in bm.faces:
        nb = [o for e in f.edges for o in e.link_faces if o is not f]
        if nb:
            avg = sum((o.normal for o in nb), Vector()).normalized()
            if f.normal.dot(avg) < 0.3:
                bad.update(f.verts)
    if not bad:
        break
    ring = set(bad) | {w for v in bad for e in v.link_edges for w in e.verts}
    bmesh.ops.smooth_vert(bm, verts=list(ring), factor=0.6, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.normal_update()
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


def seg(c, a, b):
    """Distance de c au segment ab et position le long (0 en a, 1 en b)."""
    d = b - a
    t = max(0.0, min(1.0, (c - a).dot(d) / d.length_squared))
    return (c - (a + d * t)).length, t


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
CHAIN = {}  # points du bras au repos (épaule, coude, poignet, main), pour classer les faces par la géométrie


def limb(f, s):
    """Centre du bras du côté s à la hauteur f. Si le bras touche le buste à cette hauteur (une seule section),
    on prend le bord extérieur moins un rayon de bras."""
    p = side(f, s)
    if p.x * s < 0.12 * H / 1.8:
        xs = [v.x for v in V if abs(v.z - Z(f)) < 0.008]
        p = Vector((max(xs) - 0.035 if s > 0 else min(xs) + 0.035, p.y, Z(f)))
    return p


for s, nm in ((1, "G"), (-1, "D")):
    sh = Vector((0.19 * s * H / 1.8, yc, Z(0.795)))
    el = limb(0.6, s)
    wr = limb(0.48, s)
    hand = limb(0.42, s)
    CHAIN[nm] = (sh.copy(), el.copy(), wr.copy(), hand.copy())
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

# --- Coutures : le maillage est coupé exactement le long de chaque bord de vêtement (col, ourlet du tee, manches,
# bas du jean). La limite de matière suit alors une boucle continue du maillage : plus de dents ni de triangles
# blancs. Les plans sont réglés à l'œil sur les gros plans de contrôle (assets-src/blender/controle-6-angles.py) :
# hauteur en fraction de la taille (CUTS), col plus bas devant que dans le dos (NECK_TILT, en mètres).
NECK_TILT = {"homme": 0.035, "femme": 0.04}[KIND]


def bisect(co, no, keep):
    """Coupe le maillage par le plan (co, no), seulement pour les faces dont un sommet vérifie keep."""
    bm = bmesh.new(); bm.from_mesh(body.data)
    faces = [f for f in bm.faces if any(keep(v.co) for v in f.verts)]
    geom = list({e for f in faces for e in f.edges}) + faces + list({v for f in faces for v in f.verts})
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=co, plane_no=no, dist=0.0005)
    bm.to_mesh(body.data); bm.free()


SEAMS = {}  # nom → (point, normale) ; côté +normale : au-dessus de la couture (ou vers l'épaule pour une manche)
SEAMS["neck"] = (Vector((0, yc, Z(CUTS["neck"]))), Vector((0, -NECK_TILT, 0.2)).normalized())
SEAMS["hem"] = (Vector((0, yc, Z(CUTS["hem"]))), Vector((0, 0, 1)))
SEAMS["trouser"] = (Vector((0, 0, Z(CUTS["trouser"]))), Vector((0, 0, 1)))
# Axe du haut du bras : moyenne des deux bras en miroir (le coude repéré d'un côté peut être faussé par le buste
# qui touche), inclinaison avant/arrière réduite de moitié.
_dg = (CHAIN["G"][1] - CHAIN["G"][0]).normalized()
_dd = (CHAIN["D"][1] - CHAIN["D"][0]).normalized()
_avg = Vector(((_dg.x - _dd.x) / 2, (_dg.y + _dd.y) / 4, (_dg.z + _dd.z) / 2)).normalized()
AXIS = {}
R_ARM_MID = 0.045 * H / 1.8  # demi-épaisseur du bras sous la manche


def arm_center(zz, sgn):
    """Centre réel du bras à la hauteur zz, mesuré depuis son bord extérieur (le côté intérieur peut toucher le buste)."""
    ring = [v for v in V if abs(v.z - zz) < 0.006 and v.x * sgn > 0]
    xo = max(v.x * sgn for v in ring)
    out = [v for v in ring if v.x * sgn > xo - 0.03]
    return Vector((sgn * (xo - R_ARM_MID), sum(v.y for v in out) / len(out), zz))


for nm, (sh, el, wr, hd) in CHAIN.items():
    sgn = 1 if nm == "G" else -1
    d = Vector((_avg.x if nm == "G" else -_avg.x, _avg.y, _avg.z))
    c0 = arm_center(Z(CUTS["sleeve"]), sgn)  # l'ourlet passe par le centre réel du bras, perpendiculaire à l'axe
    top = c0 - d * ((sh.z - c0.z) / max(0.3, -d.z))
    AXIS[nm] = (top, d, (el - sh).length)
    SEAMS["sleeve_" + nm] = (c0, -d)
bisect(*SEAMS["neck"], keep=lambda c: abs(c.z - SEAMS["neck"][0].z) < 0.08 and abs(c.x) < 0.14)
bisect(*SEAMS["hem"], keep=lambda c: abs(c.z - SEAMS["hem"][0].z) < 0.03)
bisect(*SEAMS["trouser"], keep=lambda c: abs(c.z - SEAMS["trouser"][0].z) < 0.03)
for nm in CHAIN:
    co, no = SEAMS["sleeve_" + nm]
    bisect(co, no, keep=lambda c, co=co: (c - co).length < 0.12)
V = [v.co.copy() for v in body.data.vertices]


def above(c, k):
    co, no = SEAMS[k]
    return (c - co).dot(no) > 0


bpy.ops.object.select_all(action="DESELECT")
body.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type="ARMATURE_AUTO")
# Le buste ne doit pas suivre le bras : les poids automatiques débordent du bras sur la poitrine et le dos, et un
# bras posé (main dans la poche, main sur la hanche) tirait alors un pli sur le tee. On retire les poids du bras
# (bras, avant-bras, main) du cœur du buste seulement (poitrine et dos, loin des bras).
gi = {g.index for g in body.vertex_groups if g.name.startswith(("Bras", "AvantBras", "Main"))}
torse = body.vertex_groups.get("Dos")


def ramp(x, a, b):
    """0 avant a, 1 après b, en douceur entre les deux (pas de marche dans les poids, donc pas de pli)."""
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


for v in body.data.vertices:
    k = max(ramp(abs(v.co.x), 0.06 * H / 1.8, 0.2 * H / 1.8), ramp(v.co.z, Z(0.8), Z(0.86)),
            1 - ramp(v.co.z, Z(0.5), Z(0.56)))
    if k >= 1:
        continue
    lost = 0.0
    for g in [g for g in v.groups if g.group in gi]:
        lost += g.weight * (1 - k)
        if k <= 0:
            body.vertex_groups[g.group].remove([v.index])
        else:
            body.vertex_groups[g.group].add([v.index], g.weight * k, "REPLACE")
    if lost > 0:
        torse.add([v.index], lost, "ADD")

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
gname = {g.index: g.name for g in body.vertex_groups}
dom = []
for v in body.data.vertices:
    best = max(v.groups, key=lambda g: g.weight, default=None)
    dom.append(gname.get(best.group, "Dos") if best else "Dos")


R_ARM = 0.16 * H / 1.8  # au-delà de cette distance de l'axe du bras, la face est le flanc ou la hanche touchée


def arm_axis(c, b):
    """Pour une face portée par un os du bras : le point de l'axe épaule → main le plus proche, ou None si la face
    est en fait le flanc ou la hanche que le bras touchait (trop loin de l'axe)."""
    nm = b[-1]
    if nm not in CHAIN:
        return None
    pts = CHAIN[nm]
    best = None
    for a_, b_ in zip(pts, pts[1:]):
        d, t = seg(c, a_, b_)
        if best is None or d < best[0]:
            best = (d, a_ + (b_ - a_) * t)
    return best[1] if best[0] < R_ARM else None


R_UP = 0.075 * H / 1.8  # rayon maximal du haut du bras, manche comprise
TORSO_W = {"homme": 0.13, "femme": 0.115}[KIND] * H / 1.8  # demi-largeur du buste à hauteur de poitrine


def zone(p):
    c = sum((V[i] for i in p.vertices), Vector()) / len(p.vertices)
    bones = [dom[i] for i in p.vertices]
    b = max(set(bones), key=bones.count)
    if not above(c, "trouser"):
        return "Basket_Blanc"
    # Haut du bras (autour de l'ourlet de manche) : décidé par la forme, pas par le squelette. Une face est sur le
    # bras si elle est plus près de l'axe du bras (rayon < R_UP) que de la surface du buste.
    for nm, (sh, d, L) in AXIS.items():
        t = (c - sh).dot(d)
        if 0.03 < t < L:
            r = (c - sh - d * t).length
            if r < R_UP and r < math.hypot(c.x, c.y - yc) - TORSO_W:
                return "Tee_Noir" if above(c, "sleeve_" + nm) else "Mannequin_Blanc_Laque"
    # Mains : tout ce qui est près de l'axe poignet → main est de la peau (la main touchait la hanche au repos).
    for nm, (sh, el, wr, hd) in CHAIN.items():
        if seg(c, wr, hd + (hd - wr) * 0.6)[0] < 0.05 * H / 1.8:
            return "Mannequin_Blanc_Laque"
    # Avant-bras et mains : os du squelette.
    if b.startswith(("Bras", "AvantBras", "Main")):
        if arm_axis(c, b) is not None:
            return "Tee_Noir" if above(c, "sleeve_" + b[-1]) else "Mannequin_Blanc_Laque"
    if above(c, "neck"):
        return "Mannequin_Blanc_Laque"
    if not above(c, "hem"):
        return "Jean_Noir_Delave"
    return "Tee_Noir"


lab = [zone(p) for p in body.data.polygons]
# Lissage : une face prend la matière majoritaire de ses voisines (bords nets), puis les îlots de moins de
# ISLAND faces (éclats blancs sur le flanc, taches de jean dans le tee) prennent la matière qui les entoure.
import bmesh
bm = bmesh.new(); bm.from_mesh(body.data); bm.faces.ensure_lookup_table()
NB = [[o.index for e in f.edges for o in e.link_faces if o.index != f.index] for f in bm.faces]
bm.free()
for _ in range(0 if __import__("os").environ.get("BRUT") else 6):
    new = lab[:]
    for i, nb in enumerate(NB):
        ls = [lab[j] for j in nb]
        if ls:
            best = max(set(ls), key=ls.count)
            if ls.count(best) * 2 > len(ls) and best != lab[i]:
                new[i] = best
    lab = new
ISLAND = int(len(lab) * 0.012)
for _ in range(0 if __import__("os").environ.get("BRUT") else 3):
    seen = [False] * len(lab)
    for i0 in range(len(lab)):
        if seen[i0]:
            continue
        comp, stack, rim = [], [i0], []
        seen[i0] = True
        while stack:
            i = stack.pop(); comp.append(i)
            for j in NB[i]:
                if lab[j] != lab[i0]:
                    rim.append(lab[j])
                elif not seen[j]:
                    seen[j] = True; stack.append(j)
        if len(comp) < ISLAND and rim and lab[i0] != "Basket_Blanc":
            best = max(set(rim), key=rim.count)
            for i in comp:
                lab[i] = best
for p, m in zip(body.data.polygons, lab):
    p.material_index = idx[m]

# --- Pose
P = arm.pose.bones


def rot(name, x=0, y=0, z=0):
    pb = P[name]
    pb.rotation_mode = "XYZ"
    pb.rotation_euler = (math.radians(x), math.radians(y), math.radians(z))


if KIND == "femme" and __import__("os").environ.get("POSE") != "libre":
    waist = max(-v.x for v in V if abs(v.z - Z(0.6)) < 0.01 and -0.2 < v.x < 0)
    tgt = bpy.data.objects.new("cible", None)
    ty, tz = (float(v) for v in __import__("os").environ.get("CIBLE", "-0.05,0.6").split(","))
    tgt.location = (-(waist + 0.015), yc + ty, Z(tz))  # poignet sur le côté de la taille (pas derrière)
    pole = bpy.data.objects.new("pole", None)
    pole.location = (-0.75, yc + 0.25, Z(0.68))
    for o in (tgt, pole):
        bpy.context.scene.collection.objects.link(o)
    ik = P["AvantBras_D"].constraints.new("IK")
    ik.target, ik.pole_target, ik.chain_count, ik.pole_angle = tgt, pole, 2, 0.0
    mx, my, mz = (float(v) for v in __import__("os").environ.get("MAIN", "0,180,0").split(","))
    rot("Main_D", x=mx, y=my, z=mz)
    rot("Bras_G", z=float(__import__("os").environ.get("ADD", "8")))
    rot("Bassin", y=4)
    rot("Dos", y=-5)
    LEG = float(__import__("os").environ.get("LEG", "7"))
    rot("Cuisse_G", x=-5, z=LEG)
    rot("Tibia_G", x=8, z=-LEG * 0.5)
    rot("Cuisse_D", z=-LEG)
    rot("Tibia_D", z=LEG * 0.5)
else:
    # Homme (référence A) : main droite dans la poche avant du jean, bras gauche détendu le long du corps.
    E = __import__("os").environ
    hip = [v for v in V if abs(v.z - Z(0.5)) < 0.01 and -0.25 < v.x < 0]
    hx = max(-v.x for v in hip)
    px, py, pz = (float(v) for v in E.get("POCHE", "0.035,0.015,0.52").split(","))
    yfront = min(v.y for v in hip if abs(-v.x - (hx - px)) < 0.015)
    tgt = bpy.data.objects.new("cible", None)
    tgt.location = (-(hx - px), yfront + py, Z(pz))  # poignet à l'entrée de la poche, la main plonge dedans
    pole = bpy.data.objects.new("pole", None)
    pole.location = (-0.7, yc + 0.35, Z(0.66))  # coude vers l'extérieur et un peu en arrière
    for o in (tgt, pole):
        bpy.context.scene.collection.objects.link(o)
    if not E.get("NOIK"):
        ik = P["AvantBras_D"].constraints.new("IK")
        ik.target, ik.pole_target, ik.chain_count, ik.pole_angle = tgt, pole, 2, 0.0
    mx, my, mz = (float(v) for v in E.get("MAIN", "0,0,0").split(","))
    rot("Main_D", x=mx, y=my, z=mz)
    ad = float(E.get("ADD", "8"))
    rot("Bras_G", z=ad)
    rot("AvantBras_G", x=-8)
    rot("Bassin", y=2, z=3)
    rot("Dos", y=-2, z=-4)
    LEG = float(__import__("os").environ.get("LEG", "7"))
    rot("Cuisse_G", x=-2, z=LEG)
    rot("Tibia_G", x=4, z=-LEG * 0.5)
    rot("Cuisse_D", z=-LEG)
    rot("Tibia_D", z=LEG * 0.5)
# Lissage correctif après le squelette : efface les plis que la pose crée près des épaules (pli sur la poitrine
# de l'homme quand le bras droit se plie) en gardant les détails du maillage au repos.
cs = body.modifiers.new("lissage_pose", "CORRECTIVE_SMOOTH")
cs.factor, cs.iterations, cs.smooth_type, cs.rest_source = 1.0, 12, "LENGTH_WEIGHTED", "ORCO"
bpy.context.view_layer.update()
# Scène de travail (squelette, poids, cibles de pose encore modifiables), gardée avant de figer la pose.
STEM = OUT.rsplit(".", 1)[0]
bpy.ops.wm.save_as_mainfile(filepath=STEM + "-rig.blend", compress=True, copy=True)

bpy.context.view_layer.objects.active = body
for m in list(body.modifiers):
    if m.type in ("ARMATURE", "CORRECTIVE_SMOOTH"):
        bpy.ops.object.modifier_apply(modifier=m.name)
body.parent = None
body.vertex_groups.clear()
for o in list(bpy.data.objects):
    if o.type in ("ARMATURE", "EMPTY"):
        bpy.data.objects.remove(o)
# Pieds sur la plaque après la pose.
low = min((body.matrix_world @ v.co).z for v in body.data.vertices)
body.location.z += plate_top - low
for p in body.data.polygons:
    p.use_smooth = True

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_yup=True, export_materials="EXPORT", export_normals=True)
xs = [(body.matrix_world @ v.co).x for v in body.data.vertices]
# Pose figée (maillage seul, comme le GLB du site), à côté de la scène de travail « -rig ».
bpy.ops.wm.save_as_mainfile(filepath=STEM + "-pose.blend", compress=True)
print("LARGEUR", round(max(xs) - min(xs), 3), "HAUTEUR", round(H, 3), "FACES", len(body.data.polygons))
