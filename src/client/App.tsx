import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { ClipboardCopy, Eye, EyeOff } from 'lucide-react';

let context: Array<number>;

// Function to detect code type from markdown code block
const getCodeType = (codeBlock: string): string => {
  const match = codeBlock.match(/^```(\w+)/);
  return match ? match[1].toLowerCase() : '';
};

// Component to render HTML preview
const HTMLPreview: React.FC<{ code: string }> = ({ code }) => {
  return (
    <div className="border-2 border-gray-600 rounded-lg p-4 bg-white mt-2">
      <div dangerouslySetInnerHTML={{ __html: code }} />
    </div>
  );
};

// Component to render React preview
const ReactPreview: React.FC<{ code: string }> = ({ code }) => {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      // Basic validation of JSX syntax
      if (code.includes('render(') || code.includes('ReactDOM.render(')) {
        setError('Direct render calls are not supported in preview');
        return;
      }
      
      // More validation could be added here
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid React code');
    }
  }, [code]);

  if (error) {
    return <div className="text-red-500 mt-2">Error: {error}</div>;
  }

  try {
    // Note: This is a simplified preview. In a real implementation,
    // you'd want to use a more robust solution like a sandboxed iframe
    return (
      <div className="border-2 border-gray-600 rounded-lg p-4 bg-white mt-2">
        <div dangerouslySetInnerHTML={{ __html: code }} />
      </div>
    );
  } catch (err) {
    return <div className="text-red-500 mt-2">Error rendering preview</div>;
  }
};

// Component to render CSS preview
const CSSPreview: React.FC<{ code: string }> = ({ code }) => {
  const [previewHtml] = useState(`
    <div class="css-preview-box">
      <div class="css-preview-content">
        <h1>Sample Content</h1>
        <p>This is a paragraph to preview CSS styles.</p>
        <button>Button</button>
      </div>
    </div>
  `);

  return (
    <div className="border-2 border-gray-600 rounded-lg p-4 bg-white mt-2">
      <style>{code}</style>
      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
    </div>
  );
};

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [responses, setResponses] = useState<string[]>([]);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [previewStates, setPreviewStates] = useState<{ [key: number]: boolean }>({});
  const focusTargetRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [responses]);

  const handleSendMessage = async () => {
    try {
      setInputDisabled(true);
      setResponses([...responses, input]);
      const ollamaResponse = await axios.post('http://localhost:3001/ollama', {
        message: input,
        context: context
      });
      context = ollamaResponse.data.context;
      setResponses([...responses, input, ollamaResponse.data.message]);
      setInput('');
    } catch (error) {
      console.error('Error sending message to Ollama:', error);
    } finally {
      setInputDisabled(false);
      setTimeout(() => {
        if (focusTargetRef.current) {
          focusTargetRef.current.focus();
        }
      }, 1000);
    }
  };

  const togglePreview = (index: number) => {
    setPreviewStates(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  // Custom component to render code blocks with copy button and preview
  const CodeBlock: React.FC<{ children: string, index: number }> = ({ children, index }) => {
    const isCodeCopied = copiedIndex === index;
    const code = children.replace(/```[\w]*\n?|```$/g, '');
    const codeType = getCodeType(children);
    const showPreview = previewStates[index];
    const canPreview = ['html', 'react', 'css', 'jsx', 'tsx'].includes(codeType);

    return (
      <div className="relative group">
        <pre className="bg-gray-800 rounded-lg p-4 my-2">
          <code className="text-sm">{code}</code>
          <div className="absolute top-2 right-2 flex gap-2">
            {canPreview && (
              <button
                onClick={() => togglePreview(index)}
                className="p-2 rounded-lg bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {showPreview ? 
                  <EyeOff className="h-4 w-4 text-gray-300" /> : 
                  <Eye className="h-4 w-4 text-gray-300" />
                }
                <span className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {showPreview ? 'Hide preview' : 'Show preview'}
                </span>
              </button>
            )}
            <CopyToClipboard 
              text={code}
              onCopy={() => {
                setCopiedIndex(index);
                setTimeout(() => setCopiedIndex(null), 2000);
              }}
            >
              <button className="p-2 rounded-lg bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                <ClipboardCopy className="h-4 w-4 text-gray-300" />
                <span className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {isCodeCopied ? 'Copied!' : 'Copy code'}
                </span>
              </button>
            </CopyToClipboard>
          </div>
        </pre>
        {showPreview && (
          <div className="mt-2">
            <div className="text-sm text-gray-400 mb-2">Preview:</div>
            {codeType === 'html' && <HTMLPreview code={code} />}
            {(codeType === 'react' || codeType === 'jsx' || codeType === 'tsx') && <ReactPreview code={code} />}
            {codeType === 'css' && <CSSPreview code={code} />}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 w-screen h-screen flex flex-col">
      <div className="bg-gray-700 flex justify-center p-4">
        <h1 className="text-white text-lg font-semibold">Ollama Chat</h1>
      </div>

      <div className="w-full max-w-screen-lg flex-1 m-auto p-8 my-4 pb-20" id="chat-messages">
        <div className="flex flex-col">
          {responses.map((response, index) => (
            <div className="mb-4" key={index}>
              <div className="flex items-start">
                <div className="ml-3 mb-3">
                  <div
                    className="bg-gray-700 text-white rounded-lg p-2 break-words"
                    style={{ backgroundColor: index % 2 === 0 ? 'black' : '' }}
                  >
                    <ReactMarkdown
                      components={{
                        code: (props: any) => {
                          const { node, inline, className, children, ...rest } = props;
                          if (!inline && typeof children === 'string') {
                            return <CodeBlock index={index}>{children}</CodeBlock>;
                          }
                          return <code className={className} {...rest}>{children}</code>;
                        }
                      }}
                    >
                      {response}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-gray-700">
        <div className="max-w-screen-lg m-auto w-full p-4 flex space-x-4 justify-center items-center">
          <textarea
            ref={focusTargetRef}
            rows={2}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 py-2 px-3 rounded-lg border-none focus:outline-none focus:ring focus:border-blue-300 bg-gray-800 text-white resize-none"
            disabled={inputDisabled}
            style={{
              opacity: inputDisabled ? 0.5 : 1,
              cursor: inputDisabled ? 'not-allowed' : 'auto'
            }}
          />
          <button
            onClick={handleSendMessage}
            className="ml-2 bg-blue-500 text-white py-2 px-4 rounded-full"
            disabled={inputDisabled}
            style={{
              opacity: inputDisabled ? 0.5 : 1,
              cursor: inputDisabled ? 'not-allowed' : 'auto'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;