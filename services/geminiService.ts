import { GoogleGenAI, Type } from "@google/genai";
import { AgentPlan, ReviewStep, AppConfig } from "../types";

/**
 * Creates a GoogleGenAI instance with the provided API key.
 */
const createAI = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("API Key 未配置，请在设置中添加。");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Handles OpenAI compatible API calls.
 */
const callOpenAI = async (
  prompt: string, 
  config: AppConfig, 
  systemInstruction?: string,
  jsonFormat: boolean = true
): Promise<string> => {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`; 
  
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const body: any = {
    model: config.model,
    messages: messages,
    // Add stream: false implicitly
  };

  if (jsonFormat) {
    body.response_format = { type: "json_object" };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("OpenAI API returned empty response.");
    }

    return content;
  } catch (error: any) {
    console.error("OpenAI Call Failed:", error);
    throw new Error(`Model request failed: ${error.message}`);
  }
};

/**
 * Analyzes the document and generates a review plan.
 */
export const analyzeAndPlan = async (text: string, config: AppConfig): Promise<AgentPlan> => {
  const promptText = `
    你是一个**自主认知的领域专家代理 (Autonomous Domain Expert Agent)**。
    你的任务不是作为AI来回答问题，而是根据文档内容，**动态重塑**你自己的身份，从而对文档进行专家级的深度评审。

    【核心原则 1：领域纯粹性 (Domain Purity)】
    **严禁跨界缝合**。你必须严格遵守文档所属领域的**原生本体论**和**话语体系**。
    - 命理学/玄学：使用“五行、八卦、气运、生克”，**严禁**使用“希尔伯特空间、量子纠缠、波函数坍缩”等科学术语强行解释。除非文档本身是科幻小说。
    - 文学艺术：使用“意象、修辞、美学、叙事结构”，**严禁**使用“NLP算法、特征向量、逻辑回归”等工程术语。
    - 现代科学/工程：严守实证主义和逻辑推导，**严禁**引入玄学、宗教或未经验证的伪科学概念。

    【核心原则 2：现实锚定 (Reality Anchoring)】
    **严禁捏造不存在的理论或专家头衔**。
    - 你的身份必须是现实世界中**真实存在**的职业或学术职位（如“资深结构工程师”、“比较文学教授”、“中医内科主任医师”）。
    - **绝对不要**创造“量子佛学研究员”、“赛博风水师”、“四维空间命理师”这种不存在的缝合怪身份。
    - 你引用的标准必须是该领域**公认**的行业标准或学术共识，不要臆造不存在的“XXX统一场理论”。

    【第一步：领域特征提取与身份构建】
    请分析输入文档，进行以下元认知决策：
    1. **核心领域识别**：这篇文档属于人类现存知识体系中的哪个具体节点？（精确到二级学科或具体工种）。
    2. **最高权威定义**：在该领域现实中，谁拥有最高话语权？定义一个**真实存在的**角色头衔（Target Persona）。
    3. **价值公理确定**：该领域的核心价值是什么？（如：法律追求严谨，文学追求共情，工程追求可行性）。

    【第二步：专家级差距分析】
    以【Target Persona】的身份审视文档：
    - 按照该领域**真实的**专业标准，文档缺了什么？
    - 指出具体的逻辑漏洞、数据缺失或理论深度不足。不要泛泛而谈。

    【第三步：规划评审路径】
    制定优化步骤，将文档提升至该领域的真实专业水平。
    - 步骤必须是**业务深度**的扩展。
    - 每一个步骤都必须直接增加文档的**含金量**（理论深度、数据精度、逻辑闭环、经典引证）。

    请以 JSON 格式返回，所有中文字段使用简体中文。
  `;

  let responseText = '';

  if (config.provider === 'openai') {
    const schemaInstruction = `
      Please strictly output JSON with the following structure:
      {
        "analysis": {
          "category": "string (The precise subdomain derived from text)",
          "assignedPersona": "string (The specific REAL-WORLD expert role. No fake titles.)",
          "currentLevel": "string",
          "targetLevel": "string",
          "summary": "string",
          "gapAnalysis": {
            "professionalStandards": "string (The real-world first-principles standard of this domain)",
            "missingContent": "string (Specific missing deep-domain logic, theory, or data)"
          }
        },
        "steps": [
          {
            "id": "string (unique id)",
            "name": "string (Actionable domain task)",
            "description": "string (Detailed technical instruction)",
            "reasoning": "string"
          }
        ]
      }
    `;
    
    const fullPrompt = `${promptText}\n\n${schemaInstruction}\n\n--- BEGIN DOCUMENT ---\n${text}\n--- END DOCUMENT ---`;
    responseText = await callOpenAI(fullPrompt, config, "You are an autonomous meta-agent. Construct your own persona based on REAL WORLD roles. Maintain domain purity.");

  } else {
    // Gemini Path
    const ai = createAI(config.apiKey);
    const response = await ai.models.generateContent({
      model: config.model,
      contents: {
        parts: [
          { text: promptText },
          { text: `--- BEGIN DOCUMENT ---\n${text}\n--- END DOCUMENT ---` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, description: "识别到的精确细分领域（必须是真实存在的学科）" },
                assignedPersona: { type: Type.STRING, description: "AI根据内容自主决定的专家身份头衔（必须是现实存在的职位）" },
                currentLevel: { type: Type.STRING },
                targetLevel: { type: Type.STRING },
                summary: { type: Type.STRING },
                gapAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    professionalStandards: { type: Type.STRING, description: "该领域的第一性原理标准" },
                    missingContent: { type: Type.STRING, description: "专家视角下不可容忍的专业内容缺失" }
                  },
                  required: ["professionalStandards", "missingContent"]
                }
              },
              required: ["category", "assignedPersona", "currentLevel", "targetLevel", "summary", "gapAnalysis"]
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                },
                required: ["id", "name", "description", "reasoning"]
              }
            }
          },
          required: ["analysis", "steps"]
        }
      }
    });
    responseText = response.text || '';
  }

  if (!responseText) {
    throw new Error("无法生成分析计划 (Empty Response)。");
  }

  const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();

  try {
    const result = JSON.parse(cleanJson);
    
    const steps: ReviewStep[] = result.steps.map((s: any) => ({
      ...s,
      id: s.id || Math.random().toString(36).substr(2, 9),
      status: 'PENDING'
    }));

    return {
      analysis: result.analysis,
      steps: steps
    };
  } catch (e) {
    console.error("JSON Parse Error:", e, cleanJson);
    throw new Error("模型返回的格式不是有效的 JSON，请重试。");
  }
};

/**
 * Executes a single step of the review plan.
 */
export const executeStep = async (
  currentText: string,
  step: ReviewStep,
  analysis: any,
  config: AppConfig
): Promise<{ revisedText: string; diffSummary: string }> => {
  // Extract the dynamically assigned persona from the analysis
  const persona = analysis.assignedPersona || analysis.category + " 专家";
  const standard = analysis.gapAnalysis?.professionalStandards || "行业最高标准";

  const promptText = `
    【身份激活程序】
    系统检测到当前文档属于 **${analysis.category}** 领域。
    你已加载身份：**${persona}**。
    
    【执行任务】
    步骤名称：${step.name}
    具体指令：${step.description}
    目标标准：${standard}

    【输出原则：真实性与纯粹性】
    1. **严禁臆造**：你所补充的理论、数据、引用或案例，必须是**现实世界中真实存在的**。不要捏造虚假的论文、不存在的法律条文或虚构的历史事件。
    2. **话语体系隔离**：彻底清洗语言风格。
       - 如果是人文学科，杜绝理科味；
       - 如果是玄学，杜绝科学味（严禁出现“量子纠缠”等词）；
       - 如果是科学，杜绝玄学味。
       - **严禁**出现“用量子力学解释八字”这种伪科学缝合。
    3. **深度注入**：使用该领域**公认**的高级概念和分析框架进行重写。
       - 不要在原有内容上修修补补。你需要利用你的专业知识，向文档中注入该领域特有的核心论据、公式推导、判例、代码实现或技术细节。
    4. **去通用化**：删掉所有正确的废话。如果一句话放进任何行业的文档都通顺，那这句话就是垃圾，删掉它。
    5. **融合重写**：输出的内容应该是经过你（${persona}）润色后的**完整文档正文**。

    请返回 JSON，包含 revisedText (重写后的完整专业文档) 和 diffSummary (你作为专家具体增加了哪些硬核内容)。
  `;

  let responseText = '';

  if (config.provider === 'openai') {
    const schemaInstruction = `
      Please strictly output JSON with the following structure:
      {
        "revisedText": "string (The full rewritten content, demonstrating extreme domain expertise, purity, and reality anchoring)",
        "diffSummary": "string (Specific summary of the proprietary knowledge/logic added)"
      }
    `;
    const fullPrompt = `${promptText}\n\n${schemaInstruction}\n\n--- INPUT TEXT ---\n${currentText}\n--- END INPUT TEXT ---`;
    responseText = await callOpenAI(fullPrompt, config, `You are the ${persona}. Maintain strict domain purity and reality.`);
  } else {
    // Gemini Path
    const ai = createAI(config.apiKey);
    const response = await ai.models.generateContent({
      model: config.model,
      contents: {
        parts: [
          { text: promptText },
          { text: `--- INPUT TEXT ---\n${currentText}\n--- END INPUT TEXT ---` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            revisedText: { type: Type.STRING },
            diffSummary: { type: Type.STRING }
          },
          required: ["revisedText", "diffSummary"]
        }
      }
    });
    responseText = response.text || '';
  }

  if (!responseText) {
    throw new Error(`执行步骤失败: ${step.name}`);
  }

  const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();

  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("JSON Parse Error:", e, cleanJson);
    throw new Error("模型返回的格式不是有效的 JSON。");
  }
};
