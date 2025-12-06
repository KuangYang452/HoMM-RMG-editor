import { MAP_OBJECTS_CN } from '../data/Lang/zhCN/mapObjects';

// --- Imported Data Mocks (Based on user provided files) ---
// In a real scenario, these might be loaded async, but for this editor we embed them 
// to ensure synchronous availability for dropdowns.

const MENU_DATA = {
    tokens: [
        {"sid":"map_gamemode_singlehero","text":"单人英雄"},
        {"sid":"map_gamemode_classic","text":"经典"}
    ]
};

const UI_DATA = {
    tokens: [
        {"sid":"win_condition_1","text":"经典"},
        {"sid":"win_condition_2","text":"首都占领"},
        {"sid":"win_condition_3","text":"首都固守"},
        {"sid":"win_condition_4","text":"勇者之战"},
        {"sid":"win_condition_5","text":"城市固守"},
        {"sid":"win_condition_6","text":"冠军锦标赛"},
        {"sid":"win_condition_7","text":"首都争夺"},
        {"sid":"templates_description_jebus_cross","text":"模板上满是厉害的宝藏！抢先对手抵达中央区域即可夺取宝藏，并在最终战斗中取得胜利。"},
        {"sid":"templates_description_harmony","text":"击败对手的英雄并夺取对方的开局城市，确保在最终战斗中取得胜利。不惜一切代价保护自己的首都吧！"},
        {"sid":"templates_description_helltide","text":"在“地狱之光”竞技场挑战你的对手，或是等到新的月份开始时，自动投入战斗。赢家通吃！"},
        {"sid":"templates_description_universe","text":"外围居所不会提供每周增长数量，请谨慎管理你的军队好击败对手！"},
        {"sid":"templates_description_shamrock","text":"创建经济、发展城市，启程冒险，在争夺权力的竞赛中击败对手！"},
        {"sid":"templates_description_hellmonth","text":"你只有 28 天的时间，且必须与对手进行多场战斗。集中精力发展城市和壮大军队以确保胜利吧！"},
        {"sid":"templates_description_hellblitz","text":"踏入充满财富的蛮荒之地——一路领取奖励，并在旅程终点迎战你的对手！"},
        {"sid":"templates_description_helix","text":"展开一场扭曲的寻宝之旅！智取对手，占领对方的首都，只要守住就能确保胜利！"},
        {"sid":"templates_description_anarchy","text":"进入彻底混乱的世界——没有限制、规则瓦解，还有错乱的地形在等着你！以全新角度体验《魔法门之英雄无敌：昔日纪元》！"},
        {"sid":"templates_description_torrent","text":"啊，海盗！"},
        {"sid":"templates_description_christmas_tree","text":"穿越节日树，从悬挂在树枝上的潘朵拉宝盒中取得宝藏。于战斗中迎战对手，再庆祝你的胜利！"},
        {"sid":"templates_description_conquest","text":"率领你原生城镇的军队征服整张地图，在多个地盘稳步前进。无尽的财富和冒险在等着你！"},
        {"sid":"templates_description_crossroads","text":"请谨慎选择路径，每条路径都有宝藏，而某些路径的奖励更丰富！"},
        {"sid":"templates_description_diamond","text":"宝藏就在附近的土地等着你，但你并非唯一的寻宝者！击败对手，否则就只能空手而归！"},
        {"sid":"templates_description_expanse","text":"刺激但罕见的模板——资源、宝物和物品皆有限。努力对抗多名对手、稳健发展，并征服土地吧！"},
        {"sid":"templates_description_fairn_square","text":"你能拥有的英雄数量等同于你控制的城市数量，非常公平！征服更多土地、创建强大队伍，再击败对手吧。"},
        {"sid":"templates_description_hallway","text":"你的城市被怪物横行的土地分隔开来，试着在怪物之间创建联系、团结你的军队，击败所有敌人并夺取宝藏！"},
        {"sid":"templates_description_ikarus","text":"对手愈多愈好！抢先抵达模板中心区域“太阳”，有大量宝藏在等着你呢。"},
        {"sid":"templates_description_jebus_outcast","text":"这个内容丰富的模板专为单一阵营军队所设计。利用潘朵拉宝盒中的单位组成强大的军队，在中心迎战对手。"},
        {"sid":"templates_description_kerberos","text":"这个稀有的模板适合 3 到 6 名玩家进行激烈对战。击败邻近对手，向中心进军——抢先抵达中心的胜算更高！"},
        {"sid":"templates_description_king_of_the_hill","text":"四周都是敌人！要在这个稀有模板的中心区域成为王者，你必须在无情的战斗中不断获胜。"},
        {"sid":"templates_description_memory_lane","text":"探索这个模板的每个区域！不过，这里没有通往宝藏区的道路，你必须自己找路进去！"},
        {"sid":"templates_description_mini_nostalgia","text":"击败附近的 AI 对手，夺取他们守护的宝藏，再面对最终的敌人。"},
        {"sid":"templates_description_miracle","text":"资源稀少、黄金有限——你的对手得有奇迹才能获胜……而你也是。"},
        {"sid":"templates_description_mlyn","text":"运用你阵营的优势，看谁能赢得胜利！只用你的原生军队突入中心区域，碾压敌人，势如破竹。"},
        {"sid":"templates_description_octojebus","text":"想和一大群朋友一起玩吗？这个 8 人模板就是你的最佳选择！收集所有物品、突破中心，加入胜利之战！"},
        {"sid":"templates_description_pyramid","text":"爬上金字塔顶端吧，那里有许多珍宝在等着你，不过，你得战胜两名对手才能获得宝藏！"},
        {"sid":"templates_description_showdown","text":"七名对手、没有资源、没有黄金……在如此严苛的条件下，谁能胜出？你的机智与运气将受到终极考验！"},
        {"sid":"templates_description_spider","text":"这个模板就像蜘蛛网，包含多个区域和对手。别指望会有大笔财富，还得小心别迷路。"},
        {"sid":"templates_description_trinity_one","text":"在这个内容丰富的模板上，你可以从三条路线中选择一条来抵达敌人所在地。路途愈短，等待你的危险和宝藏就愈丰富。"},
        {"sid":"templates_description_trinity","text":"在这个内容丰富的模板上，你可以从三条路线中选择一条来抵达敌人所在地。路途愈短，等待你的危险和宝藏就愈丰富。"},
        {"sid":"templates_description_vendetta","text":"你已获得重要的全域法术卷轴。使用卷轴征服这片陆地，收集中心区域的所有宝藏并击败对手！"},
        {"sid":"templates_description_eye_of_the_storm","text":"战争永无止境……吗？击败中心区域的守卫，那里每个人都无比渴望加入你的队伍。"},
        {"sid":"templates_description_wastelands","text":"一场瘟疫摧毁了这片土地……为了收集资源与活下来，你必须征服遥远的土地进行开拓。"},
        {"sid":"templates_description_jadame_diplomacy","text":"在这个巨大的模板上，展现你的外交手腕，集齐一支无敌的军队吧！"},
        {"sid":"templates_description_symmetry","text":"厌倦了总是产生不公平的地图？在这个双方起始区域几乎相同的竞技场风格模板中，证明你的实力吧。"},
    ]
};

const SHAOWAN_DATA = {
    tokens: [
        {"sid":"templates_description_triumvirate","text":"国外老哥弄的一张图，一个标准的小富图，有固定龙巫妖。"},
        {"sid":"templates_description_spider_e","text":"原图穷得叮当响，一般人不爱玩，特有此改\n初始区散落资源：10000 -> 15000\n副城区散落资源：0 -> 15000\n初始区野怪强度：1 -> 0.85"},
        {"sid":"templates_description_one_land","text":"全图只有一个区，随机一种地形，每人都出生在除中间以外的任意位置，整幅图拥有相当高的随机性。"},
        {"sid":"templates_description_one_land_mini","text":"逐鹿秘境mini，更小的地域，更少的人数，地图密度基本维持不变。"},
        {"sid":"templates_description_gods_road","text":"你需要在追杀下一路破关到红树林，积累实力最后反扑。初始城无市政厅，两飞地城为魔法塔挂件。1.06英雄出生就是10级，自带闪电箭和零蓝耗的原始混沌。"},
        {"sid":"templates_description_EL_DORADO","text":"金子！金子！除了金子还是金子！中间沙漠富饶却无道路，外围区域有交易区、学习区。\n开局3个屋子分别教外交、理财、侦查。"},
        {"sid":"templates_description_jieting_2p","text":"穿越三国驻扎街亭，不可谓不是地狱开局，你需要用仅剩的物资和兵力杀穿包围才能重拾天命。\n2.1为初始英雄增加了零蓝耗的原始混沌。"},
        {"sid":"templates_description_jieting_3p","text":"穿越三国驻扎街亭，不可谓不是地狱开局，你需要用仅剩的物资和兵力杀穿包围才能重拾天命。\n2.1为初始英雄增加了零蓝耗的原始混沌。"},
        {"sid":"templates_description_knight_duel","text":"圣堂骑兵和墓园死骑的专属地图，1号位玩白骑，2号位玩黑骑。各自有大量的骑兵宝屋和招募巢穴。"},
        {"sid":"templates_description_land_random_items","text":"每人初始有5件传奇+1件史诗装备，中央的红树林区域是个富区。"},
        {"sid":"templates_description_land_random","text":"每人都有不一样的开局，每人都有 3 家邻居，没有公共区域。"},
        {"sid":"templates_description_land","text":"中间玩家最强也最富，但是却连通著其他7名玩家。"},
        {"sid":"templates_description_super_random","text":"一张伴随佣兵公会的地图，玩家两两相连，想见到对面两个必须穿过大宝区，大宝区富得流油，抢到就是赚到，但小心隔壁捅腰子。"},
        {"sid":"templates_description_land_of_exile","text":"雇佣兵图（超级随机）的最初设想版，最初由于不知道如何禁招兵建筑所以没做成这样。本图除中城外所有城都无法招兵，中城能招5-7级兵。"},
        {"sid":"templates_description_enchanted_forest","text":"这片充满神秘的森林里藏有稀世珍宝，贪婪之人逐渐被吸引而至，一场旷日持久的纷争即将拉开序幕。\n2.0对这个恶心地图进行了重制。"},
        {"sid":"templates_description_enchanted_forest_ex","text":"Ex版增加第8位玩家，初生区为大宝区的满级圣物城，其余AI的初始城建也有所升级。\n2.0对这个恶心地图进行了重制。"},
        {"sid":"templates_description_whirlpool","text":"初始区域有大量粉尘，但是两家共有，上来就要生死一搏。没到交汇点前，地形基本是无优势的，野城是跟我方不同的。"},
        {"sid":"templates_description_whirlpool_ex","text":"初始不再送兵，隔壁还是有送但是减少了数量。另外两端初始不再血拼，其所有英雄的四系魔法初始等级为3，其副城初始皆有好几周的产量，并送了三级后勤。"}
    ]
};

// --- Initialization ---

const tokens = (MAP_OBJECTS_CN as any).tokens || [];
const lookup = new Map<string, string>();

tokens.forEach((t: any) => {
    if (t.sid && t.text) {
        lookup.set(t.sid, t.text);
    }
});

// Load additional data
[MENU_DATA, UI_DATA, SHAOWAN_DATA].forEach(dataset => {
    dataset.tokens.forEach((t:any) => {
        if(t.sid && t.text) {
            lookup.set(t.sid, t.text);
        }
    });
});

// --- Exports ---

export const getLocalizedName = (sid: string): string => {
    // Try explicit name key first
    const nameKey = `${sid}_name`;
    if (lookup.has(nameKey)) return lookup.get(nameKey)!;
    
    // Fallback to direct sid
    if (lookup.has(sid)) return lookup.get(sid)!;

    return sid;
};

export const getLocalizedDescription = (sid: string): string => {
    const descKey = `${sid}_description`;
    if (lookup.has(descKey)) return lookup.get(descKey)!;

    const narrKey = `${sid}_narrativeDescription`;
    if (lookup.has(narrKey)) return lookup.get(narrKey)!;

    return "";
};

// Helper for Dropdowns
export const getGameModes = () => [
    { value: "Classic", label: lookup.get("map_gamemode_classic") || "Classic" },
    { value: "SingleHero", label: lookup.get("map_gamemode_singlehero") || "SingleHero" }
];

export const getWinConditions = () => {
    return UI_DATA.tokens
        .filter(t => t.sid.startsWith('win_condition_'))
        .map(t => ({ value: t.sid, label: t.text }));
};

export const getTemplateDescriptions = () => {
    const descs: {value: string, label: string}[] = [];
    const seen = new Set<string>();

    // Scan UI_DATA and SHAOWAN_DATA for templates_description_*
    [UI_DATA, SHAOWAN_DATA].forEach(dataset => {
        dataset.tokens.forEach(t => {
            if (t.sid.startsWith('templates_description_') && !seen.has(t.sid)) {
                seen.add(t.sid);
                // Truncate long descriptions for dropdown
                const shortLabel = t.text.length > 40 ? t.text.substring(0, 40) + "..." : t.text;
                descs.push({ value: t.sid, label: shortLabel });
            }
        });
    });
    return descs;
};
