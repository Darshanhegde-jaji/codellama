
## How do I use it?

### Install Ollama

Visit [ollama.ai](https://ollama.ai/) and get it. It's also in AUR, it works in WSL2.

### Start Ollama

Run following command:

``` sh
ollama serve
```

...and let it run. You might also start ollama as a service, which is explained on
their GitHub.

### Pull desired AI model

``` sh
ollama pull mistral
```

Chatbot uses `mistral` by default, but it is easy to change. Important thing is that you need
to have this model in order to use it (obviously).

### Install ollama-chat

Clone this repository:

``` sh
git clone https://github.com/wmwnuk/ollama-chat.git
```

Go to the project directory and install dependencies:

``` sh
cd ollama-chat
npm install
```

Start the application itself:

``` sh
npm run start-dev
```

...and then go to [localhost:8080](http://localhost:8080) and have a nice conversation. :)
