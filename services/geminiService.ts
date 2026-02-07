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

    【第一步：领域特征提取与身份构建】
    请分析输入文档，进行以下元认知决策：
    1. **核心领域识别**：这篇文档属于人类知识图谱中的哪个具体细分节点？（尽量精确，例如是“高频交易算法”而不是“金融”，是“伤寒论经方”而不是“中医”）。
    2. **最高权威定义**：在这个细分领域，谁掌握着真理和最高标准？定义一个具体的角色头衔（Target Persona）。
       - *示例逻辑*：如果文档谈论火箭发动机，你就是“首席推进系统工程师”；如果谈论红楼梦，你就是“红学研究员”。
    3. **价值公理确定**：该领域的核心价值是什么？
       - *示例逻辑*：法律的核心价值是“严谨与风控”；文学的核心价值是“共情与修辞”；工程的核心价值是“可行性与效率”。

    【第二步：专家级差距分析】
    以你刚刚定义的【Target Persona】身份，审视当前文档：
    - 文档目前处于什么水平？（比如：业余爱好者随笔 / 初级从业者草稿 / 缺乏深度的概述）。
    - 既然你是这个领域的权威，你不能容忍文档中缺少哪些**关键要素**？
      - *关键*：寻找那些只有真正行家才知道的缺失点（Missing Domain Context）。不要关注通用的格式或语法问题。

    【第三步：规划评审路径】
    制定一系列优化步骤，将文档从当前水平提升到该领域的【行业顶尖/学术权威】水平。
    - 步骤必须是**业务深度**的扩展。
    - 每一个步骤都必须直接增加文档的**含金量**（理论深度、数据精度、逻辑闭环）。

    请以 JSON 格式返回，所有中文字段使用简体中文。
  `;

  let responseText = '';

  if (config.provider === 'openai') {
    const schemaInstruction = `
      Please strictly output JSON with the following structure:
      {
        "analysis": {
          "category": "string (The precise subdomain derived from text)",
          "assignedPersona": "string (The specific expert role you have decided to adopt)",
          "currentLevel": "string",
          "targetLevel": "string",
          "summary": "string",
          "gapAnalysis": {
            "professionalStandards": "string (The first-principles standard of this domain)",
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
    responseText = await callOpenAI(fullPrompt, config, "You are an autonomous meta-agent. Construct your own persona.");

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
                category: { type: Type.STRING, description: "识别到的精确细分领域" },
                assignedPersona: { type: Type.STRING, description: "AI根据内容自主决定的专家身份头衔" },
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
    
    你不再是通用AI。你现在的思维方式、知识库索引、语言风格必须完全符合 **${persona}** 的特征。
    
    【执行任务】
    步骤名称：${step.name}
    具体指令：${step.description}
    目标标准：${standard}

    【输出原则：专业主义 (Professionalism)】
    1. **深度注入**：不要在原有内容上修修补补。你需要利用你的专业知识，向文档中注入该领域特有的**模型、算法、定律、引证、数据或逻辑推演**。
    2. **去通用化**：严禁使用“万金油”式的废话（如“综上所述”、“为了更好地发展”）。如果一句话放进任何行业的文档都通顺，那这句话就是垃圾，删掉它。
    3. **实操落地**：
       - 遇到计算需求，给出公式和演算过程。
       - 遇到策略需求，给出具体的执行路径和参数。
       - 遇到理论需求，引用具体的权威出处（书名、篇章、条款号）。
    4. **融合重写**：输出的内容应该是经过你（${persona}）润色后的**完整文档正文**。

    请返回 JSON，包含 revisedText (重写后的完整专业文档) 和 diffSummary (你作为专家具体增加了哪些硬核内容)。
  `;

  let responseText = '';

  if (config.provider === 'openai') {
    const schemaInstruction = `
      Please strictly output JSON with the following structure:
      {
        "revisedText": "string (The full rewritten content, demonstrating extreme domain expertise)",
        "diffSummary": "string (Specific summary of the proprietary knowledge/logic added)"
      }
    `;
    const fullPrompt = `${promptText}\n\n${schemaInstruction}\n\n--- INPUT TEXT ---\n${currentText}\n--- END INPUT TEXT ---`;
    responseText = await callOpenAI(fullPrompt, config, `You are the ${persona}. Act accordingly.`);
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