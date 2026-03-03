# Erro EBUSY no Windows (OneDrive)

Se aparecer `EBUSY: resource busy or locked` em arquivos da pasta `.next`, o OneDrive (ou outro processo) está bloqueando os arquivos.

## Solução rápida

1. **Pare o servidor** – No terminal onde está rodando `npm run dev`, pressione `Ctrl+C`.
2. **Exclua a pasta `.next`** – No Explorador de Arquivos, apague a pasta `.next` dentro do projeto.  
   Se der erro de “arquivo em uso”, pause a sincronização do OneDrive (ícone na bandeja) e tente de novo.
3. **Inicie de novo** – No terminal: `npm run dev`.

## Solução definitiva (recomendada)

Mover o projeto **para fora da pasta do OneDrive** evita esse tipo de travamento:

- Exemplo: copiar o projeto para `C:\dev\Toro-Admin` (ou `C:\projetos\Toro-Admin`).
- Trabalhar sempre nessa cópia e não na que está no Desktop/OneDrive.

Assim o Next.js consegue ler e gravar os arquivos em `.next` sem conflito com o OneDrive.
