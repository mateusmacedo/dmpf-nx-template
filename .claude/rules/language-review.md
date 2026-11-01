# Revisão de idioma antes do PR

A revisão de prosa em PT-BR (`pt-reviewer`) e em inglês (`en-reviewer`) roda **uma vez,
antes de abrir o PR**, sobre o conjunto de arquivos com prosa que a branch alterou. Ela é
opcional: pergunte se a pessoa quer rodar ou pular. Escrever ou editar arquivos durante o
desenvolvimento não dispara revisor.

## Como aplicar

1. Durante a tarefa, escreva e edite sem chamar revisor.
2. Antes do PR, liste os arquivos da branch que têm prosa (specs, ADRs, guias, READMEs,
   comentários de API, mensagens ao usuário) e ofereça a revisão.
3. Se aceita, rode **um** `pt-reviewer` para o conjunto em PT-BR e **um** `en-reviewer`
   para o conjunto em inglês, em paralelo.
4. Aplique só as correções aprovadas. Arquivo com os dois idiomas passa pelos dois
   revisores.

[MOTIVO]: a prosa muda até o fim da tarefa. Um revisor por edição multiplica latência e
tokens e revisa o mesmo texto várias vezes; uma passada no estado final revisa cada texto
uma vez, como ele vai para o PR.
