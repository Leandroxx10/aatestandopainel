CORREÇÃO TURNOS V6

Regra confirmada pelo usuário:
- Turno 1: data selecionada 06:00 até 14:00.
- Turno 2: data selecionada 14:00 até 22:00.
- Turno 3: data selecionada 22:00 até 06:00 do dia seguinte.

Exemplo:
- Selecionando 03/05/2026 + Turno 3, o gráfico consulta de 03/05/2026 22:00 até 04/05/2026 06:00.

Arquivo alterado:
- history-charts.js

Observação:
- O filtro agora usa janela por timestamp real em America/Sao_Paulo, evitando comparação apenas por texto/hora.
