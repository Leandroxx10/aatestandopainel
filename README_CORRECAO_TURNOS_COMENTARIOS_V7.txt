WMoldes - Correção V7

Correções aplicadas no painel administrativo:

1) Filtro de turnos
- Corrigido conflito de botões ativos duplicados/ocultos.
- O gráfico agora considera apenas o botão de período visível e ativo.
- Turno 1: 06:00 até 14:00 do dia selecionado.
- Turno 2: 14:00 até 22:00 do dia selecionado.
- Turno 3: 22:00 do dia selecionado até 06:00 do dia seguinte.
- Mantida a consulta por timestamp real em America/Sao_Paulo.

2) Atalho "Ver no gráfico" dos comentários/anotações
- Corrigida seleção automática da máquina.
- Corrigida seleção automática da data, incluindo datas em formato BR, ISO e textos com horário.
- Corrigida seleção automática do turno conforme horário inicial da anotação.
- Após clicar, o modal fecha, o gráfico recarrega e rola para o horário aproximado.

3) Exclusão pelo modal de comentários
- Adicionado botão moderno de exclusão no card de comentário/anotação.
- Remove o registro diretamente do Firebase pelo caminho original.
- Atualiza a lista do modal depois da exclusão.

Arquivos principais alterados:
- history-charts.js
- history-comments-modal.js
- history-comment-shortcut.js
- history-chart-notes-integrated.css
- admin.html

Validação:
- Sintaxe JavaScript validada com node --check.
