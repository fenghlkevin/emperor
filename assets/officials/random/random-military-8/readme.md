# 本朝武将模板8立绘

人物 ID：`random-military-8`；分类：随机人物模板；角色：武将。

此目录是一套固定外观模板，可供多位随机生成的官员复用；游戏中的姓名、年龄和任职信息由人物数据决定。

由内置 image_gen 生成，每人包含头像、个人全身像和朝堂立绘三张独立 PNG。

共同提示词：古代中国皇帝策略游戏人物素材；彩色写实手绘风格，自然人体比例与统一暖色侧上方光线，真实织物、面部及发须细节；透明背景，不含场景、地面、烟雾、光晕、文字、界面或水印。同一人物的头像、个人全身像和朝堂立绘保持五官、肤色、年龄感、发须及体型一致。

人物提示词（原始美术设定）：年龄感 36 岁；面部与身份特征：long lined face, thick gray eyebrows, long divided gray beard, gentle steady eyes, mature bronze complexion；个人服装与道具：indigo practical surcoat over dark steel historical lamellar armor, dark military cap, black boots, cavalry bow, restrained natural shoulder armor。这些描述用于游戏美术，不作为历史人物真实容貌或年龄的考证。

| 文件 | 用途与绘制提示词 | 当前尺寸 |
| --- | --- | --- |
| [avatar.png](avatar.png) | 头像：正方形头肩近景，面部清晰；完整保留头饰，露出上胸；沿用全身像的个人服装与身份特征。用于选官名册、人员列表和传召入口。 | 1254 × 1254 |
| [full.png](full.png) | 个人全身像：从头饰到鞋底完整入画，正面站立，自然约七点半头身；使用人物专属服装及代表性道具，保留少量透明边距。用于召见、人物档案和完整立绘预览。 | 1024 × 1536 |
| [court.png](court.png) | 朝堂立绘：保持个人全身像的面部身份与体型，改穿统一深青色朝服、黑色乌纱帽、深色腰带与黑靴；双手在胸前持笏，衣袖收束，正面恭立；文臣用鹤纹、武将用兽纹补子；不穿战甲，不携战斗武器。用于朝堂独立人物层。 | 1024 × 1536 |

素材路径由 `src/official-art-data.mjs` 登记，执行 `node scripts/sync-official-art.mjs` 可同步。替换图片时保留人物目录和三个文件名，并复核三张图的身份一致性与透明背景。
