import { NextResponse } from 'next/server';
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import conversationData from './model.json';

let model: any = null;
let encodedInputs: any = null;

// モデルとエンコード済みデータの初期化
async function initialize() {
  if (!model) {
    model = await use.load();
    // 学習データのinputをエンコード
    const inputs = conversationData.conversations.map(conv => conv.input);
    encodedInputs = await model.embed(inputs);
  }
  return { model, encodedInputs };
}

// 最も類似した応答を見つける
async function findMostSimilarResponse(userInput: string) {
  const { model, encodedInputs } = await initialize();
  
  // ユーザー入力をエンコード
  const inputEmbedding = await model.embed([userInput]);
  
  // コサイン類似度の計算
  const similarities = tf.metrics.cosineProximity(
    inputEmbedding,
    encodedInputs
  ).arraySync();

  // 類似度とインデックスのペアを作成してソート
  const similarityPairs = similarities.map((similarity: number, index: number) => ({
    similarity,
    index
  }));
  
  // 類似度で降順ソート
  similarityPairs.sort((a, b) => b.similarity - a.similarity);

  // 最も類似度が高い応答を取得
  const bestMatch = similarityPairs[0];
  
  // 類似度が閾値以上の場合のみ応答を返す
  if (bestMatch.similarity > 0.5) {
    return conversationData.conversations[bestMatch.index].output;
  } else {
    return "申し訳ありません。その質問にはお答えできません。";
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    
    // 入力バリデーション
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const lastMessage = body.messages[body.messages.length - 1].content;

    if (!lastMessage || typeof lastMessage !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message content' },
        { status: 400 }
      );
    }

    // 類似した応答を検索
    const response = await findMostSimilarResponse(lastMessage);

    return NextResponse.json({
      message: response,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      },
      { status: 500 }
    );
  }
}