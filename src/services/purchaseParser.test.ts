/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { extractPrice, guessCategory, parseSharedPurchase } from "./purchaseParser";

/**
 * O parser é heurístico e vai ser mexido conforme lojas mudam seus títulos.
 * Estes casos são payloads reais de compartilhamento, e existem para que um
 * ajuste em uma loja não quebre silenciosamente as outras.
 *
 * A regra que não pode cair: preço errado é pior que preço ausente. O agente
 * fala sobre o dinheiro da pessoa — na dúvida, ele pergunta.
 */

describe("extractPrice", () => {
  test("lê o formato brasileiro com centavos", () => {
    expect(extractPrice("R$ 1.899,90")).toBe(1899.9);
    expect(extractPrice("R$ 299,90")).toBe(299.9);
    expect(extractPrice("R$1.899")).toBe(1899);
  });

  test("entre parcela e total, fica com o total", () => {
    expect(extractPrice("R$ 3.499,00 ou 12x de R$ 291,58 sem juros")).toBe(3499);
  });

  test("aceita 'por' sem cifrão", () => {
    expect(extractPrice("saindo por apenas 199,90")).toBe(199.9);
  });

  test("não confunde número solto com preço", () => {
    expect(extractPrice("Galaxy S24 256GB")).toBeNull();
    expect(extractPrice("Cadeira suporta 180 kg")).toBeNull();
    expect(extractPrice("Notebook 15,6 polegadas")).toBeNull();
  });

  test("os padrões têm flag global e precisam sobreviver a chamadas repetidas", () => {
    expect(extractPrice("R$ 10,00")).toBe(10);
    expect(extractPrice("R$ 10,00")).toBe(10);
    expect(extractPrice("R$ 10,00")).toBe(10);
  });
});

describe("guessCategory", () => {
  test("classifica pelo produto", () => {
    expect(guessCategory("Tênis Nike Revolution")).toBe("Moda");
    expect(guessCategory("Notebook Dell i5")).toBe("Tecnologia");
    expect(guessCategory("Passagem para Lisboa")).toBe("Viagem");
  });

  test("palavra maior não é a mesma palavra", () => {
    // "gamer" é móvel ou periférico, não entretenimento.
    expect(guessCategory("Cadeira gamer")).toBe("Casa");
  });

  test("desiste em vez de chutar", () => {
    expect(guessCategory("Kit com 3 unidades")).toBe("Outro");
  });
});

describe("parseSharedPurchase", () => {
  test("Mercado Livre: preço no título, loja pela URL", () => {
    const got = parseSharedPurchase({
      title: "Tênis Nike Revolution 7 Masculino - R$ 299,90 | Mercado Livre",
      url: "https://www.mercadolivre.com.br/tenis-nike/p/MLB123",
    });
    expect(got.name).toBe("Tênis Nike Revolution 7 Masculino");
    expect(got.price).toBe(299.9);
    expect(got.merchant).toBe("Mercado Livre");
    expect(got.category).toBe("Moda");
  });

  test("Amazon sem preço: pede em vez de inventar", () => {
    const got = parseSharedPurchase({
      title: "Echo Dot 5ª geração | Amazon.com.br",
      url: "https://www.amazon.com.br/dp/B09B8X9RGM",
    });
    expect(got.price).toBeNull();
    expect(got.merchant).toBe("Amazon");
    expect(got.name).toBe("Echo Dot 5ª geração");
  });

  test("Android costuma mandar a URL dentro de text", () => {
    const got = parseSharedPurchase({
      title: "Smart TV 50 4K",
      text: "Olha isso https://www.magazineluiza.com.br/tv/p/123 por R$ 2.199,00",
    });
    expect(got.price).toBe(2199);
    expect(got.merchant).toBe("Magazine Luiza");
    // A URL não pode vazar para o nome do produto.
    expect(got.name).not.toContain("http");
  });

  test("compartilhamento vazio ainda produz algo verdadeiro", () => {
    const got = parseSharedPurchase({ url: "https://www.shopee.com.br/produto-i.123.456" });
    expect(got.name).toBe("Compra em Shopee");
    expect(got.price).toBeNull();
  });

  test("loja desconhecida vira o próprio domínio", () => {
    const got = parseSharedPurchase({ title: "Camiseta", url: "https://lojinha.com.br/p/1" });
    expect(got.merchant).toBe("lojinha.com.br");
  });

  test("título gigante vira nome, não parágrafo", () => {
    const got = parseSharedPurchase({
      title:
        "Conjunto de Panelas Antiaderente 5 Peças com Revestimento Cerâmico Indicado para Todos os Tipos de Fogão Inclusive Indução",
    });
    expect(got.name.length).toBeLessThanOrEqual(72);
    expect(got.name.endsWith("…")).toBe(true);
  });

  test("URL inválida não derruba o parser", () => {
    const got = parseSharedPurchase({ title: "Algo", url: "não é uma url" });
    expect(got.merchant).toBeNull();
    expect(got.name).toBe("Algo");
  });
});
