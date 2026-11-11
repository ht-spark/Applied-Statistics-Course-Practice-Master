import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local', quiet: true });
const client = postgres(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL, { max: 1 });
const uni1 = '43200000-0000-4000-8000-000000000001';
const uni2 = '43200000-0000-4000-8000-000000000002';
const paper1 = '43200000-0000-4000-8000-000000000011';
const paper2 = '43200000-0000-4000-8000-000000000012';
const examples = [
  { id: '43200000-0000-4000-8000-000000000021', paper: paper1, type: 'single_choice', number: 1,
    content: '【示例题，非院校真题】若 $X \\sim N(0,1)$，则 $P(X \\leq 0)$ 等于多少？',
    answer: 'B', analysis: '标准正态分布关于 0 对称，因此 $P(X \\leq 0)=0.5$。', knowledge: '正态分布',
    options: [['A', '0'], ['B', '0.5'], ['C', '1'], ['D', '无法确定']] },
  { id: '43200000-0000-4000-8000-000000000022', paper: paper1, type: 'multiple_choice', number: 2,
    content: '【示例题，非院校真题】下列哪些可以用于描述一组数值型数据的集中趋势？',
    answer: 'ABC', analysis: '均值、中位数、众数描述集中趋势；方差描述离散程度。', knowledge: '描述统计',
    options: [['A', '均值'], ['B', '中位数'], ['C', '众数'], ['D', '方差']] },
  { id: '43200000-0000-4000-8000-000000000023', paper: paper1, type: 'true_false', number: 3,
    content: '【示例题，非院校真题】若随机变量 $X$ 的方差存在，则 $\\operatorname{Var}(X) \\geq 0$。',
    answer: 'true', analysis: '方差是非负随机变量 $(X-E[X])^2$ 的期望，因此非负。', knowledge: '数字特征', options: [] },
  { id: '43200000-0000-4000-8000-000000000024', paper: paper1, type: 'calculation', number: 4,
    content: '【示例题，非院校真题】某总体均值为 $\\mu$、方差为 $\\sigma^2$。从中抽取容量为 $n$ 的独立同分布样本，求样本均值 $\\bar X$ 的期望和方差。',
    answer: 'E(X̄)=μ，Var(X̄)=σ²/n。', analysis: '$E[\\bar X]=\\mu$。由样本独立性，$\\operatorname{Var}(\\bar X)=n\\sigma^2/n^2=\\sigma^2/n$。', knowledge: '抽样分布', options: [] },
  { id: '43200000-0000-4000-8000-000000000025', paper: paper1, type: 'short_answer', number: 5,
    content: '【示例题，非院校真题】简述假设检验中的第一类错误与第二类错误。',
    answer: '第一类错误是在原假设为真时拒绝原假设；第二类错误是在原假设为假时未拒绝原假设。',
    analysis: '第一类错误概率通常记为 $\\alpha$，第二类错误概率记为 $\\beta$；检验功效为 $1-\\beta$。', knowledge: '假设检验', options: [] },
  { id: '43200000-0000-4000-8000-000000000026', paper: paper2, type: 'single_choice', number: 1,
    content: '【解锁示例题，非院校真题】若事件 $A$ 与 $B$ 独立，且 $P(A)=0.4$、$P(B)=0.5$，则 $P(A \\cap B)$ 等于多少？',
    answer: 'A', analysis: '独立事件的交集概率为 $P(A)P(B)=0.4\\times0.5=0.2$。', knowledge: '事件的独立性',
    options: [['A', '0.2'], ['B', '0.4'], ['C', '0.5'], ['D', '0.9']] },
];

try {
  await client.begin(async (tx) => {
    for (const [id, name, premium, order] of [[uni1, '示例院校一', false, 1], [uni2, '示例院校二', true, 2]]) {
      await tx`insert into universities (id,name,short_name,location,description,logo_url,is_premium,price,sort_order)
        values (${id},${name},${name},'演示内容','用于体验刷题功能的虚构院校，题目为原创示例，非真实院校真题。','',${premium},0,${order})
        on conflict (id) do nothing`;
    }
    for (const [id, university, title, premium, score] of [
      [paper1, uni1, '432 统计学示例练习卷（非院校真题）', false, 50],
      [paper2, uni2, '432 模拟解锁体验卷（非院校真题）', true, 10],
    ]) {
      await tx`insert into exam_papers (id,university_id,year,title,description,total_score,duration,is_premium)
        values (${id},${university},2026,${title},'原创示例内容，仅供体验功能。',${score},30,${premium})
        on conflict (id) do nothing`;
    }
    for (const question of examples) {
      const inserted = await tx`insert into questions (id,paper_id,question_type,question_number,content,correct_answer,analysis,score,knowledge_point)
        values (${question.id},${question.paper},${question.type},${question.number},${question.content},${question.answer},${question.analysis},10,${question.knowledge})
        on conflict (id) do nothing returning id`;
      if (inserted.length) {
        for (const [index, [key, text]] of question.options.entries()) {
          await tx`insert into question_options (question_id,option_key,content,sort_order) values (${question.id},${key},${text},${index})`;
        }
      }
    }
    await tx`insert into products (id,name,description,product_type,target_id,price,original_price,duration_days)
      values ('43200000-0000-4000-8000-000000000031','示例院校二练习包','免费体验模拟支付和内容解锁，无实际扣款。','university_bundle',${uni2},0,0,365)
      on conflict (id) do nothing`;
    await tx`insert into products (id,name,description,product_type,target_id,price,original_price,duration_days)
      values ('43200000-0000-4000-8000-000000000032','示例会员体验','仅用于体验会员权益，无实际扣款。','vip','',0,0,365)
      on conflict (id) do nothing`;
  });
  console.log('Demo content ready: 2 fictional universities, 2 papers, 6 example questions, 2 free demonstration products.');
} finally { await client.end({ timeout: 5 }); }
