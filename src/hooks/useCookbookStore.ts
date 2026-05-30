import { useState, useEffect, useCallback, useMemo } from 'react';

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  steps: string[];
  cookTime: number;
  method: '炒' | '煮' | '蒸' | '烤' | '炖' | '煎' | '拌' | '炸' | '焖' | '烧' | '腌' | '其他';
  taste: '咸鲜' | '酸甜' | '麻辣' | '清淡' | '香辣' | '酱香' | '酸辣' | '甜' | '苦' | '其他';
  tags: string[];
  linkedRecipeIds: string[];
  note: string;
  linkUrl: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'private-desktop-cookbook-v2';

const defaultRecipes: Recipe[] = [
  // ============ 原有菜谱 ============
  {
    id: 'recipe-1', name: '番茄炒蛋',
    ingredients: ['番茄 2个', '鸡蛋 3个', '葱花 适量', '盐 1小勺', '糖 1小勺', '食用油 适量'],
    steps: ['番茄洗净切块，鸡蛋打散备用', '热锅凉油，倒入蛋液炒散盛出', '锅中留底油，下番茄块翻炒出汁', '倒入炒好的鸡蛋，加盐和糖调味', '撒葱花，翻炒均匀出锅'],
    cookTime: 15, method: '炒', taste: '咸鲜', tags: ['家常菜', '快手菜', '下饭菜'], linkedRecipeIds: ['recipe-2'],
    note: '番茄要选熟透的，炒出来汁多味浓', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'recipe-2', name: '番茄蛋花汤',
    ingredients: ['番茄 1个', '鸡蛋 2个', '紫菜 适量', '虾皮 少许', '盐 适量', '香油 少许', '葱花 适量'],
    steps: ['番茄去皮切小块', '水烧开，放入番茄煮5分钟', '紫菜虾皮放入碗中', '鸡蛋打散，缓缓倒入汤中形成蛋花', '加盐调味，冲入碗中，滴香油撒葱花'],
    cookTime: 10, method: '煮', taste: '清淡', tags: ['汤品', '快手菜', '家常菜'], linkedRecipeIds: ['recipe-1'],
    note: '番茄去皮口感更好', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'recipe-3', name: '红烧肉',
    ingredients: ['五花肉 500g', '冰糖 30g', '生抽 2勺', '老抽 1勺', '料酒 2勺', '姜片 5片', '八角 2个', '桂皮 1小段'],
    steps: ['五花肉切块冷水下锅焯水', '锅中少油，下冰糖炒出糖色', '放入肉块翻炒上色', '加生抽老抽料酒姜片八角桂皮', '加热水没过肉块，大火烧开转小火炖1小时', '大火收汁即可'],
    cookTime: 90, method: '炖', taste: '酱香', tags: ['硬菜', '下饭', '传统菜'], linkedRecipeIds: [],
    note: '糖色不要炒过头，否则会苦', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'recipe-4', name: '清蒸鲈鱼',
    ingredients: ['鲈鱼 1条', '姜丝 适量', '葱丝 适量', '蒸鱼豉油 2勺', '料酒 1勺', '食用油 适量'],
    steps: ['鲈鱼处理干净，两面划刀', '鱼身抹料酒，放姜丝腌制10分钟', '水开上锅蒸8-10分钟', '倒掉蒸出的汤汁，铺上新葱丝姜丝', '淋上蒸鱼豉油，浇热油即可'],
    cookTime: 20, method: '蒸', taste: '清淡', tags: ['海鲜', '健康', '宴客'], linkedRecipeIds: [],
    note: '蒸鱼时间根据鱼的大小调整', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'recipe-5', name: '麻婆豆腐',
    ingredients: ['嫩豆腐 1块', '牛肉末 100g', '豆瓣酱 1勺', '花椒粉 适量', '蒜末 适量', '姜末 适量', '葱花 适量', '水淀粉 适量'],
    steps: ['豆腐切小块，盐水焯烫去豆腥', '锅中油烧热，炒牛肉末至酥香', '下豆瓣酱姜蒜末炒出红油', '加高汤或水烧开，放入豆腐', '中小火烧5分钟，水淀粉勾芡', '撒花椒粉和葱花出锅'],
    cookTime: 20, method: '烧', taste: '麻辣', tags: ['川菜', '下饭', '家常菜'], linkedRecipeIds: [],
    note: '牛肉末要炒酥才香，花椒粉最后撒', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'recipe-6', name: '凉拌黄瓜',
    ingredients: ['黄瓜 2根', '蒜末 适量', '生抽 1勺', '醋 1勺', '香油 少许', '辣椒油 适量', '白糖 少许'],
    steps: ['黄瓜拍碎切段', '加盐腌制10分钟出水', '倒掉水分，加蒜末生抽醋', '加糖香油辣椒油拌匀', '装盘即可'],
    cookTime: 15, method: '拌', taste: '酸辣', tags: ['凉菜', '快手菜', '夏日'], linkedRecipeIds: [],
    note: '黄瓜拍碎比切条更入味', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
  },

  // ============ 轻食减脂 - 沙拉类 ============
  {
    id: 'recipe-s1', name: '希腊风味沙拉（希腊沙拉）',
    ingredients: ['樱桃番茄 200g', '黄瓜 1根', '紫洋葱 1/4个', '甜椒 1个', '卡拉马塔橄榄 10颗', '菲达奶酪 80g', '特级初榨橄榄油 2勺', '红酒醋 1勺', '干牛至 1茶匙', '盐 适量'],
    steps: ['樱桃番茄对半切开', '黄瓜、甜椒切块，紫洋葱切薄片', '将橄榄、刺山柑加入碗中', '橄榄油、红酒醋、牛至、盐调成酱汁', '加入菲达奶酪块', '淋上酱汁拌匀即可'],
    cookTime: 10, method: '拌', taste: '清淡', tags: ['轻食', '减脂', '沙拉', '地中海', '低卡'], linkedRecipeIds: ['recipe-s2', 'recipe-s3'],
    note: '254千卡/份，低碳健康。源自希腊传统沙拉做法。', linkUrl: 'https://pickyeaterblog.com/healthy-greek-salad-recipe-feta/',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-s2', name: '三文鱼牛油果沙拉',
    ingredients: ['三文鱼 150g', '牛油果 1个', '球生菜 100g', '原味酸奶 2勺', '现磨黑胡椒 适量', '海盐 适量', '柠檬汁 1勺'],
    steps: ['三文鱼切块，用少许盐和黑胡椒腌制', '牛油果去皮去核切块', '生菜洗净撕小块铺底', '放上三文鱼和牛油果', '淋酸奶和柠檬汁', '撒黑胡椒即可'],
    cookTime: 15, method: '拌', taste: '清淡', tags: ['轻食', '减脂', '沙拉', '高蛋白', '低卡'], linkedRecipeIds: ['recipe-s1', 'recipe-s4'],
    note: '富含Omega-3和健康脂肪', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-s3', name: '苦菊银耳沙拉',
    ingredients: ['苦菊 150g', '泡发银耳 80g', '甜椒 半个', '小番茄 6个', '盐 适量', '橄榄油 1勺', '黑胡椒碎 适量', '苹果醋 1勺'],
    steps: ['苦菊洗净沥干', '银耳泡发后撕小朵，焯水1分钟', '甜椒切丝，小番茄对半切', '所有食材放入碗中', '橄榄油、苹果醋、盐、黑胡椒调成酱汁', '淋上酱汁拌匀'],
    cookTime: 10, method: '拌', taste: '清淡', tags: ['轻食', '减脂', '沙拉', '低卡'], linkedRecipeIds: ['recipe-s1', 'recipe-s5'],
    note: '银耳富含膳食纤维，苦菊清热降火', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-s4', name: '鹰嘴豆素食便当沙拉',
    ingredients: ['鹰嘴豆 100g', '鸡蛋 2个', '西兰花 80g', '紫甘蓝 50g', '杏鲍菇 1个', '胡萝卜 半根', '秋葵 3根', '橄榄油 1勺', '醋 1勺', '生抽 1勺'],
    steps: ['鹰嘴豆提前泡发煮熟', '鸡蛋煮熟切块', '西兰花、秋葵焯水', '杏鲍菇、胡萝卜切片煎熟', '紫甘蓝切丝', '所有食材装盘', '橄榄油醋生抽调成酱汁淋上'],
    cookTime: 25, method: '拌', taste: '清淡', tags: ['轻食', '减脂', '沙拉', '高蛋白', '素食'], linkedRecipeIds: ['recipe-s2'],
    note: '鹰嘴豆是优质植物蛋白来源', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-s5', name: '羽衣甘蓝鸡肉沙拉（Spinach & Strawberry Chicken Salad）',
    ingredients: ['鸡胸肉 150g', '嫩菠菜 100g', '草莓 6个', '核桃 15g', '红洋葱 1/4个', '油醋汁 2勺'],
    steps: ['鸡胸肉煎熟切片', '草莓切块，红洋葱切丝', '菠菜洗净沥干铺底', '放上鸡肉、草莓、核桃、洋葱', '淋上油醋汁拌匀即可'],
    cookTime: 20, method: '拌', taste: '酸甜', tags: ['轻食', '减脂', '沙拉', '高蛋白', '低卡'], linkedRecipeIds: ['recipe-s3'],
    note: '267千卡/份，约含24g蛋白质。源自美国健康沙拉做法。', linkUrl: 'https://www.tasteofhome.com/collection/low-calorie-salads/',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-s6', name: '芦笋菠菜鸡肉沙拉（Asparagus Spinach Salad with Chicken）',
    ingredients: ['鸡胸肉 150g', '芦笋 100g', '嫩菠菜 80g', '柠檬 半个', '橄榄油 1勺', '盐 适量', '黑胡椒 适量'],
    steps: ['芦笋切段焯水2分钟', '鸡胸肉用盐黑胡椒腌制后煎熟切片', '菠菜铺底，放上芦笋和鸡肉', '淋橄榄油和柠檬汁', '撒黑胡椒即可'],
    cookTime: 15, method: '拌', taste: '清淡', tags: ['轻食', '减脂', '沙拉', '高蛋白'], linkedRecipeIds: ['recipe-s5'],
    note: '源自美国春季沙拉做法', linkUrl: 'https://www.tasteofhome.com/collection/low-calorie-salads/',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-s7', name: '凯撒沙拉碗（Caesar Salad Bowl）',
    ingredients: ['罗马生菜 150g', '鸡胸肉 100g', '帕玛森芝士 20g', '全麦面包丁 30g', '凯撒酱 1勺（低卡版：酸奶+柠檬汁+蒜+芥末）', '黑胡椒 适量'],
    steps: ['生菜洗净撕小块', '鸡胸肉煎熟切片', '全麦面包切小丁，烤箱180度烤5分钟至脆', '芝士刨丝', '所有食材放入碗中', '淋上凯撒酱拌匀'],
    cookTime: 15, method: '拌', taste: '咸鲜', tags: ['轻食', '减脂', '沙拉', '低卡'], linkedRecipeIds: ['recipe-s5', 'recipe-s6'],
    note: '用酸奶代替蛋黄酱可降低一半热量', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-s8', name: '彩虹蔬菜沙拉碗（Rainbow Salad Bowl with Peanut Sauce）',
    ingredients: ['胡萝卜 半根', '紫甘蓝 50g', '甜椒 半个', '黄瓜 半根', '毛豆 30g', '糙米饭 半碗', '花生酱 1勺', '酱油 半勺', '青柠汁 半勺'],
    steps: ['胡萝卜、紫甘蓝、甜椒切丝', '毛豆焯水煮熟', '所有蔬菜铺在糙米饭上', '花生酱、酱油、青柠汁调成酱汁', '淋上酱汁拌匀即可'],
    cookTime: 15, method: '拌', taste: '咸鲜', tags: ['轻食', '减脂', '沙拉', '素食', '高纤'], linkedRecipeIds: ['recipe-s7'],
    note: '源自美国备餐沙拉做法，色彩丰富营养均衡', linkUrl: 'https://drgooddeed.com/weight-loss/meal-prep-recipes-for-weight-loss/',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-s9', name: '金枪鱼尼斯沙拉（Tuna Nicoise Salad）',
    ingredients: ['金枪鱼罐头 1罐（水浸）', '鸡蛋 2个', '小番茄 8个', '四季豆 50g', '小土豆 2个', '橄榄 6颗', '油醋汁 2勺', '生菜 适量'],
    steps: ['鸡蛋煮熟剥壳切半', '四季豆焯水，小土豆煮熟切块', '生菜铺底', '放上金枪鱼、鸡蛋、番茄、四季豆、土豆、橄榄', '淋上油醋汁即可'],
    cookTime: 25, method: '拌', taste: '咸鲜', tags: ['轻食', '减脂', '沙拉', '高蛋白', '法式'], linkedRecipeIds: ['recipe-s2'],
    note: '源自法国尼斯，经典法式沙拉。327千卡/份。', linkUrl: 'https://www.tasteofhome.com/collection/low-calorie-salads/',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-s10', name: '甜薯羽衣甘蓝沙拉（Sweet Potato Kale Salad with Peanut Dressing）',
    ingredients: ['甜薯（红薯） 1个', '羽衣甘蓝 100g', '鸡胸肉 100g', '花生酱 1勺', '酱油 半勺', '苹果醋 半勺'],
    steps: ['甜薯去皮切块，200度烤20分钟', '羽衣甘蓝撕小块，用手按摩至变软', '鸡胸肉煎熟切片', '花生酱、酱油、醋调成酱汁', '所有食材拌匀即可'],
    cookTime: 30, method: '拌', taste: '咸鲜', tags: ['轻食', '减脂', '沙拉', '高纤'], linkedRecipeIds: ['recipe-s8'],
    note: '源自美国EatingWell网站备餐沙拉做法', linkUrl: 'https://www.eatingwell.com/meal-prep-recipes-to-help-you-lose-weight-11911481',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },

  // ============ 轻食减脂 - 波奇碗 ============
  {
    id: 'recipe-p1', name: '牛油果波奇饭（Avocado Poke Bowl）',
    ingredients: ['糙米饭 1碗', '三文鱼（或金枪鱼） 100g', '牛油果 半个', '毛豆 30g', '小番茄 6个', '海苔碎 适量', '酱油 半勺', '芝麻油 少许', '芝麻 适量'],
    steps: ['糙米饭煮熟铺碗底', '三文鱼切小块，用酱油和芝麻油腌制', '牛油果切块，小番茄对半切', '毛豆焯水', '所有食材摆放到米饭上', '撒海苔碎和芝麻即可'],
    cookTime: 20, method: '拌', taste: '清淡', tags: ['轻食', '减脂', '波奇碗', '高蛋白', '低卡'], linkedRecipeIds: ['recipe-p2', 'recipe-s2'],
    note: '源自夏威夷波奇碗做法，可用藜麦代替糙米', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-p2', name: '虾仁鸡肉波奇饭',
    ingredients: ['糙米饭 1碗', '虾仁 80g', '鸡腿肉 100g', '西兰花 50g', '玉米粒 30g', '小番茄 6个', '生抽 半勺', '醋 半勺', '橄榄油 少许'],
    steps: ['糙米饭煮熟铺碗底', '鸡肉用盐生抽黑胡椒腌制后煎熟切块', '虾仁煎熟', '西兰花玉米粒焯水', '所有食材摆放到米饭上', '橄榄油醋生抽调成油醋汁淋上'],
    cookTime: 25, method: '拌', taste: '清淡', tags: ['轻食', '减脂', '波奇碗', '高蛋白'], linkedRecipeIds: ['recipe-p1', 'recipe-p3'],
    note: '碳水蛋白蔬菜全齐活', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-p3', name: '藜麦素食波奇碗（Quinoa Veggie Bowl）',
    ingredients: ['藜麦 80g', '烤鹰嘴豆 50g', '牛油果 半个', '甜菜根 半个', '小番茄 6个', '芝麻酱 1勺', '柠檬 半个'],
    steps: ['藜麦煮熟沥干', '甜菜根切块烤熟', '牛油果番茄切块', '鹰嘴豆烤至酥脆', '所有食材放入碗中', '芝麻酱加柠檬汁调成酱汁淋上'],
    cookTime: 30, method: '拌', taste: '清淡', tags: ['轻食', '减脂', '波奇碗', '素食', '高纤'], linkedRecipeIds: ['recipe-p1', 'recipe-p2'],
    note: '源自美国EatingWell超级食物碗做法', linkUrl: 'https://www.eatingwell.com/meal-prep-recipes-to-help-you-lose-weight-11911481',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },

  // ============ 轻食减脂 - 盖饭类 ============
  {
    id: 'recipe-g1', name: '盐葱酱鸡胸肉盖饭',
    ingredients: ['鸡胸肉 200g', '米饭 1碗', '葱花 2勺', '蒜末 1勺', '白芝麻 1勺', '香油 半勺', '盐 适量', '黑胡椒 适量', '无菌蛋 1个'],
    steps: ['鸡胸肉切条，加生抽蚝油淀粉腌制30分钟', '鸡皮朝下煎至两面金黄熟透切块', '调盐葱酱：葱花+蒜末+白芝麻+香油+盐+黑胡椒', '煎单面流心蛋', '米饭铺底+鸡胸肉+浇酱+蛋'],
    cookTime: 35, method: '煎', taste: '咸鲜', tags: ['轻食', '减脂', '盖饭', '高蛋白'], linkedRecipeIds: ['recipe-g2', 'recipe-g3'],
    note: '源自日式盐葱酱做法，低卡版减脂必备', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-g2', name: '滑蛋虾仁盖饭',
    ingredients: ['虾仁 150g', '鸡蛋 3个', '米饭 1碗', '盐 适量', '淀粉 1勺', '黑胡椒 适量', '葱花 适量'],
    steps: ['虾仁用盐淀粉抓匀腌5分钟', '鸡蛋加1勺水打散', '热锅少油，滑炒虾仁至变色盛出', '倒蛋液，微微凝固时倒回虾仁', '翻炒至蛋液裹住虾仁', '米饭+滑蛋虾仁一盖即可'],
    cookTime: 15, method: '炒', taste: '咸鲜', tags: ['轻食', '减脂', '盖饭', '高蛋白'], linkedRecipeIds: ['recipe-g1', 'recipe-g4'],
    note: '高蛋白海鲜丼平替，低卡又满足', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-g3', name: '三色鸡胸肉盖饭',
    ingredients: ['鸡胸肉 200g', '菠菜 100g', '鸡蛋 2个', '米饭 1碗', '蒜末 适量', '生抽 1勺', '蚝油 1勺', '蜂蜜 半勺'],
    steps: ['鸡胸肉切块，生抽蚝油蜂蜜腌制10分钟', '煎熟鸡胸肉', '菠菜焯水切段', '鸡蛋煎成蛋皮切丝', '摆成三色盖在米饭上', '浇少许酱汁即可'],
    cookTime: 20, method: '煎', taste: '咸鲜', tags: ['轻食', '减脂', '盖饭', '快手'], linkedRecipeIds: ['recipe-g1'],
    note: '打工人10分钟速成减脂饭', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-g4', name: '黄瓜番茄炒蛋盖饭',
    ingredients: ['黄瓜 1根', '番茄 2个', '鸡蛋 3个', '米饭 1碗', '盐 适量', '蒜末 适量'],
    steps: ['黄瓜切片加盐腌15分钟挤掉水', '番茄去皮切块，鸡蛋炒熟备用', '热油爆香蒜末，下番茄炒出沙', '倒鸡蛋黄瓜片，加盐调味', '翻炒均匀盖在米饭上'],
    cookTime: 15, method: '炒', taste: '清淡', tags: ['轻食', '减脂', '盖饭', '夏日'], linkedRecipeIds: ['recipe-g2'],
    note: '清爽到发光的夏日减脂饭', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },

  // ============ 轻食减脂 - 汤品类 ============
  {
    id: 'recipe-t1', name: '鲜虾菌菇汤',
    ingredients: ['鲜虾 150g', '白玉菇 100g', '蟹味菇 80g', '姜丝 适量', '盐 适量', '白胡椒粉 少许', '葱花 适量'],
    steps: ['虾去壳去虾线', '菌菇洗净撕小朵', '水烧开，下菌菇煮5分钟', '放入虾仁煮至变色', '加盐白胡椒粉调味', '撒葱花出锅'],
    cookTime: 15, method: '煮', taste: '清淡', tags: ['轻食', '减脂', '汤品', '低卡', '高蛋白'], linkedRecipeIds: ['recipe-t2'],
    note: '极低热量高蛋白的减脂汤', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-t2', name: '番茄虾滑粉丝汤',
    ingredients: ['番茄 2个', '虾仁 200g', '魔芋粉丝 1把', '蛋清 1个', '淀粉 1勺', '盐 适量', '白胡椒粉 适量', '葱花 适量'],
    steps: ['番茄去皮切小块', '虾仁用刀背拍成泥，加蛋清淀粉盐搅打上劲', '水烧开，放入番茄煮5分钟', '虾滑用勺子舀入汤中', '放入魔芋粉丝煮2分钟', '加盐白胡椒粉调味，撒葱花'],
    cookTime: 20, method: '煮', taste: '酸甜', tags: ['轻食', '减脂', '汤品', '低卡'], linkedRecipeIds: ['recipe-t1'],
    note: '魔芋粉丝几乎零热量', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-t3', name: '紫菜蛋花汤',
    ingredients: ['紫菜 适量', '鸡蛋 2个', '虾皮 少许', '盐 适量', '香油 少许', '葱花 适量'],
    steps: ['紫菜撕小块放入碗中', '虾皮放入碗中', '水烧开', '鸡蛋打散缓缓倒入汤中形成蛋花', '加盐调味，冲入碗中', '滴香油撒葱花'],
    cookTime: 5, method: '煮', taste: '清淡', tags: ['轻食', '减脂', '汤品', '低卡', '快手'], linkedRecipeIds: ['recipe-t1', 'recipe-t2'],
    note: '最快手的低卡汤品', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-t4', name: '荷叶薏米粥',
    ingredients: ['荷叶（干） 1张', '薏米 50g', '大米 50g', '陈皮 1小块', '水 适量'],
    steps: ['荷叶洗净撕小块', '薏米提前浸泡2小时', '大米薏米加水煮开', '放入荷叶和陈皮', '小火煮至粥浓稠', '取出荷叶即可食用'],
    cookTime: 60, method: '煮', taste: '清淡', tags: ['轻食', '减脂', '粥品', '养生'], linkedRecipeIds: ['recipe-t3'],
    note: '荷叶清热利湿，薏米健脾祛湿', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-t5', name: '减脂卷心菜汤（Cabbage Soup for Weight Loss）',
    ingredients: ['卷心菜 半个', '胡萝卜 1根', '甜椒 1个', '番茄 2个', '洋葱 半个', '盐 适量', '黑胡椒 适量'],
    steps: ['所有蔬菜切块', '锅中加水烧开', '放入所有蔬菜', '大火烧开后转小火煮20分钟', '加盐黑胡椒调味即可'],
    cookTime: 30, method: '煮', taste: '清淡', tags: ['轻食', '减脂', '汤品', '低卡'], linkedRecipeIds: ['recipe-t3', 'recipe-t4'],
    note: '源自欧美减脂卷心菜汤减肥法', linkUrl: 'https://www.eatingwell.com/meal-prep-recipes-to-help-you-lose-weight-11911481',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },

  // ============ 轻食减脂 - 备餐碗类 ============
  {
    id: 'recipe-m1', name: '烤蔬菜鹰嘴豆碗（Roasted Veggie Hummus Bowls）',
    ingredients: ['鹰嘴豆泥 3勺', '西葫芦 半根', '彩椒 1个', '茄子 半个', '樱桃番茄 8个', '橄榄油 1勺', '盐 适量', '黑胡椒 适量'],
    steps: ['西葫芦、彩椒、茄子切块', '蔬菜加橄榄油盐黑胡椒拌匀', '200度烤20分钟', '鹰嘴豆泥铺碗底', '放上烤蔬菜', '可配全麦皮塔饼食用'],
    cookTime: 30, method: '烤', taste: '清淡', tags: ['轻食', '减脂', '备餐', '素食', '高纤'], linkedRecipeIds: ['recipe-m2', 'recipe-m3'],
    note: '源自EatingWell网站，富含纤维饱腹感强', linkUrl: 'https://www.eatingwell.com/meal-prep-recipes-to-help-you-lose-weight-11911481',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-m2', name: '咖喱鸡肉备餐碗（Curry Chicken Meal-Prep Bowls）',
    ingredients: ['鸡胸肉 200g', '咖喱粉 1勺', '糙米 1碗', '西兰花 100g', '胡萝卜 半根', '椰浆 2勺', '洋葱 1/4个'],
    steps: ['鸡胸肉切块，用咖喱粉腌制', '洋葱炒香，加鸡肉煎至变色', '加椰浆和少许水煮10分钟', '西兰花胡萝卜焯水', '糙米饭铺底，放上咖喱鸡和蔬菜'],
    cookTime: 30, method: '煮', taste: '酱香', tags: ['轻食', '减脂', '备餐', '高蛋白'], linkedRecipeIds: ['recipe-m1', 'recipe-m3'],
    note: '源自EatingWell备餐系列', linkUrl: 'https://www.eatingwell.com/meal-prep-recipes-to-help-you-lose-weight-11911481',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-m3', name: '青柠香菜鸡肉碗（Cilantro-Lime Chicken Bowls）',
    ingredients: ['鸡胸肉 200g', '青柠 2个', '香菜 适量', '糙米 1碗', '黑豆 50g', '玉米粒 30g', '辣椒粉 适量'],
    steps: ['鸡胸肉用青柠汁、香菜、辣椒粉腌制30分钟', '煎熟鸡肉切片', '糙米饭铺底', '放上鸡肉、黑豆、玉米粒', '淋少许青柠汁即可'],
    cookTime: 35, method: '煎', taste: '酸辣', tags: ['轻食', '减脂', '备餐', '高蛋白'], linkedRecipeIds: ['recipe-m1', 'recipe-m2'],
    note: '源自美式墨西哥风味备餐碗', linkUrl: 'https://drgooddeed.com/weight-loss/meal-prep-recipes-for-weight-loss/',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-m4', name: '菠菜黑豆沙拉碗（Spinach & Black Bean Burrito Bowls）',
    ingredients: ['嫩菠菜 100g', '黑豆 80g', '鸡蛋 2个', '莎莎酱 2勺', '牛油果 半个', '全麦玉米饼 1张'],
    steps: ['菠菜洗净', '鸡蛋炒熟', '黑豆加热', '所有食材放在菠菜上', '加莎莎酱和牛油果', '可卷成卷饼或当沙拉碗吃'],
    cookTime: 15, method: '拌', taste: '咸鲜', tags: ['轻食', '减脂', '备餐', '高蛋白'], linkedRecipeIds: ['recipe-m3'],
    note: '源自EatingWell网站备餐系列', linkUrl: 'https://www.eatingwell.com/meal-prep-recipes-to-help-you-lose-weight-11911481',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-m5', name: '鹰嘴豆芽菜沙拉（Brussels Sprouts Salad with Crunchy Chickpeas）',
    ingredients: ['抱子甘蓝 150g', '烤鹰嘴豆 50g', '帕玛森芝士 15g', '柠檬汁 1勺', '橄榄油 1勺', '盐 适量'],
    steps: ['抱子甘蓝切薄片', '烤鹰嘴豆备用', '芝士刨丝', '所有食材放入碗中', '柠檬汁橄榄油盐调成酱汁', '淋上酱汁拌匀'],
    cookTime: 10, method: '拌', taste: '清淡', tags: ['轻食', '减脂', '备餐', '高纤', '素食'], linkedRecipeIds: ['recipe-m1'],
    note: '10分钟搞定的高纤沙拉', linkUrl: 'https://www.eatingwell.com/meal-prep-recipes-to-help-you-lose-weight-11911481',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },

  // ============ 轻食减脂 - 早餐类 ============
  {
    id: 'recipe-b1', name: '肉桂梨隔夜燕麦（Cinnamon-Pear Overnight Oats）',
    ingredients: ['燕麦片 50g', '梨 1个', '肉桂粉 1茶匙', '枫糖浆 1勺', '希腊酸奶 2勺', '核桃碎 10g', '奇亚籽 1勺'],
    steps: ['梨去皮切小块，用肉桂和枫糖浆炒至软糯', '燕麦、酸奶、奇亚籽混合', '加入炒好的梨', '搅拌均匀，密封冷藏过夜', '早上取出撒核桃碎即可'],
    cookTime: 5, method: '其他', taste: '甜', tags: ['轻食', '减脂', '早餐', '备餐', '高纤'], linkedRecipeIds: ['recipe-b2', 'recipe-b3'],
    note: '源自EatingWell网站隔夜燕麦系列，无需早晨烹饪', linkUrl: 'https://www.eatingwell.com/meal-prep-recipes-to-help-you-lose-weight-11911481',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-b2', name: '蓝莓芝士隔夜燕麦（Blueberry Cheesecake Overnight Oats）',
    ingredients: ['燕麦片 50g', '蓝莓 50g', '奶油奶酪 1勺', '蜂蜜 半勺', '牛奶 100ml', '奇亚籽 1勺'],
    steps: ['燕麦、牛奶、奇亚籽混合', '加入奶油奶酪和蜂蜜搅匀', '加入蓝莓', '密封冷藏过夜即可'],
    cookTime: 5, method: '其他', taste: '甜', tags: ['轻食', '减脂', '早餐', '备餐'], linkedRecipeIds: ['recipe-b1', 'recipe-b3'],
    note: '像吃蓝莓芝士蛋糕的减脂早餐', linkUrl: 'https://www.eatingwell.com/meal-prep-recipes-to-help-you-lose-weight-11911481',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-b3', name: '花生酱蛋白隔夜燕麦（Peanut Butter Protein Overnight Oats）',
    ingredients: ['燕麦片 50g', '花生粉 1勺', '蛋白粉 半勺', '奇亚籽 1勺', '牛奶 100ml', '香蕉 半根'],
    steps: ['所有干性材料混合', '加入牛奶搅拌均匀', '切片香蕉放入', '密封冷藏过夜', '每份含17g蛋白质'],
    cookTime: 5, method: '其他', taste: '甜', tags: ['轻食', '减脂', '早餐', '备餐', '高蛋白'], linkedRecipeIds: ['recipe-b1', 'recipe-b2'],
    note: '源自EatingWell高蛋白早餐系列', linkUrl: 'https://www.eatingwell.com/meal-prep-recipes-to-help-you-lose-weight-11911481',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-b4', name: '无壳迷你蛋饼（Mini Crustless Quiches with Kale, Mushrooms & Feta）',
    ingredients: ['鸡蛋 4个', '羽衣甘蓝 50g', '蘑菇 3个', '菲达奶酪 30g', '洋葱 1/4个'],
    steps: ['鸡蛋打散', '羽衣甘蓝、蘑菇、洋葱切碎', '所有食材混合', '倒入马芬模具', '180度烤20分钟'],
    cookTime: 25, method: '烤', taste: '咸鲜', tags: ['轻食', '减脂', '早餐', '备餐', '高蛋白'], linkedRecipeIds: ['recipe-b1'],
    note: '源自EatingWell备餐早餐系列', linkUrl: 'https://drgooddeed.com/weight-loss/meal-prep-recipes-for-weight-loss/',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },

  // ============ 轻食减脂 - 凉拌类 ============
  {
    id: 'recipe-c1', name: '凉拌素三丝',
    ingredients: ['胡萝卜 1根', '黄瓜 1根', '海带丝 100g', '盐 适量', '糖 少许', '香油 1勺', '辣油 适量', '醋 2勺', '蒜 2瓣'],
    steps: ['胡萝卜、黄瓜切丝', '海带丝焯水煮熟', '蒜切末', '所有食材放入碗中', '加盐糖醋香油辣油', '拌匀腌制10分钟更入味'],
    cookTime: 15, method: '拌', taste: '酸辣', tags: ['轻食', '减脂', '凉拌', '低卡'], linkedRecipeIds: ['recipe-c2'],
    note: '经典中式减脂凉拌菜', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-c2', name: '日式素暖锅',
    ingredients: ['蟹味菇 100g', '北豆腐 半块', '魔芋结 6个', '罗马生菜 100g', '生抽 1勺', '白糖 半勺', '纯净水 500ml'],
    steps: ['所有食材洗净切块', '锅中加水烧开', '放入所有食材', '加生抽白糖调味', '小火煮10分钟即可'],
    cookTime: 20, method: '煮', taste: '清淡', tags: ['轻食', '减脂', '暖锅', '低卡', '素食'], linkedRecipeIds: ['recipe-c1', 'recipe-t4'],
    note: '日式清淡暖锅，极低热量', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
  {
    id: 'recipe-c3', name: '蒜泥西兰花拌白灼虾',
    ingredients: ['西兰花 200g', '鲜虾 150g', '蒜末 2勺', '生抽 1勺', '香油 少许', '盐 适量'],
    steps: ['西兰花掰小朵焯水', '虾白灼至变色', '蒜末加生抽香油调成酱汁', '西兰花和虾放入碗中', '淋上酱汁拌匀'],
    cookTime: 10, method: '拌', taste: '咸鲜', tags: ['轻食', '减脂', '凉拌', '高蛋白'], linkedRecipeIds: ['recipe-c1'],
    note: '经典减脂搭配，高蛋白低热量', linkUrl: '',
    createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-05-01T00:00:00.000Z',
  },
];

function loadRecipes(): Recipe[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all recipes have linkUrl field
      return parsed.map((r: Recipe) => ({ ...r, linkUrl: r.linkUrl || '' }));
    }
  } catch { /* ignore */ }
  return defaultRecipes;
}

function saveRecipes(recipes: Recipe[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  } catch { /* ignore */ }
}

export function useCookbookStore() {
  const [recipes, setRecipes] = useState<Recipe[]>(() => loadRecipes());

  useEffect(() => {
    saveRecipes(recipes);
  }, [recipes]);

  const addRecipe = useCallback((recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: `recipe-${Date.now()}`,
      linkUrl: recipe.linkUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRecipes(prev => [newRecipe, ...prev]);
    return newRecipe.id;
  }, []);

  const updateRecipe = useCallback((id: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>) => {
    setRecipes(prev => prev.map(r =>
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    ));
  }, []);

  const deleteRecipe = useCallback((id: string) => {
    setRecipes(prev => {
      const filtered = prev.filter(r => r.id !== id);
      return filtered.map(r => ({
        ...r,
        linkedRecipeIds: r.linkedRecipeIds.filter(lid => lid !== id),
      }));
    });
  }, []);

  const toggleLink = useCallback((recipeId: string, targetId: string) => {
    setRecipes(prev => prev.map(r => {
      if (r.id !== recipeId) return r;
      const hasLink = r.linkedRecipeIds.includes(targetId);
      return {
        ...r,
        linkedRecipeIds: hasLink
          ? r.linkedRecipeIds.filter(id => id !== targetId)
          : [...r.linkedRecipeIds, targetId],
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  // Search & filter
  const searchRecipes = useCallback((query: string, filters: {
    method?: string;
    taste?: string;
    maxTime?: number;
    ingredient?: string;
  } = {}): Recipe[] => {
    return recipes.filter(r => {
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchIngredient = r.ingredients.some(i => i.toLowerCase().includes(q));
        const matchTag = r.tags.some(t => t.toLowerCase().includes(q));
        const matchNote = r.note.toLowerCase().includes(q);
        if (!matchName && !matchIngredient && !matchTag && !matchNote) return false;
      }
      if (filters.method && r.method !== filters.method) return false;
      if (filters.taste && r.taste !== filters.taste) return false;
      if (filters.maxTime && r.cookTime > filters.maxTime) return false;
      if (filters.ingredient && !r.ingredients.some(i => i.toLowerCase().includes(filters.ingredient!.toLowerCase()))) return false;
      return true;
    });
  }, [recipes]);

  // Get related recipes
  const getRelatedRecipes = useCallback((recipeId: string): Recipe[] => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return [];
    return recipes.filter(r => {
      if (r.id === recipeId) return false;
      const sharedTags = r.tags.some(t => recipe.tags.includes(t));
      const isLinked = recipe.linkedRecipeIds.includes(r.id);
      const sharedMethod = r.method === recipe.method;
      const sharedTaste = r.taste === recipe.taste;
      return sharedTags || isLinked || (sharedMethod && sharedTaste);
    });
  }, [recipes]);

  // Stats
  const stats = useMemo(() => {
    const methods = new Map<string, number>();
    const tastes = new Map<string, number>();
    const allTags = new Map<string, number>();
    let totalTime = 0;

    recipes.forEach(r => {
      methods.set(r.method, (methods.get(r.method) || 0) + 1);
      tastes.set(r.taste, (tastes.get(r.taste) || 0) + 1);
      r.tags.forEach(t => allTags.set(t, (allTags.get(t) || 0) + 1));
      totalTime += r.cookTime;
    });

    return {
      total: recipes.length,
      methods: Array.from(methods.entries()).sort((a, b) => b[1] - a[1]),
      tastes: Array.from(tastes.entries()).sort((a, b) => b[1] - a[1]),
      tags: Array.from(allTags.entries()).sort((a, b) => b[1] - a[1]),
      avgTime: recipes.length > 0 ? Math.round(totalTime / recipes.length) : 0,
    };
  }, [recipes]);

  return {
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleLink,
    searchRecipes,
    getRelatedRecipes,
    stats,
  };
}
