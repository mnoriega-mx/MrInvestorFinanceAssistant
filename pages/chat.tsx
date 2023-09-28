import { ChatContainer, MainContainer, Message, MessageInput, MessageList, TypingIndicator } from "@chatscope/chat-ui-kit-react";
import styles from '@/styles/Chat.module.css';
import { useEffect, useRef, useState } from "react";
import { ChatCompletionRequestMessageRoleEnum, Configuration, OpenAIApi } from "openai";

type Message = {
    content: string;
    sentTime: number;
    sender: string;
    direction: 'incoming' | 'outgoing';
}

const CHATGPT_USER = "Mr. Investor";
const DEAFULT_BEHAVIOR = "Coach Financiero";
const CONFIGURATION = new Configuration({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
})
const OPENAI_CLIENT = new OpenAIApi(CONFIGURATION);

export default function Chat() {
    const messageInput = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [behaviorInput, setBehaviorInput] = useState(DEAFULT_BEHAVIOR);
    const [behavior, setBehavior] = useState(DEAFULT_BEHAVIOR);

    const [waitingForResponse, setWaitingForResponse] = useState(false);

    useEffect(() => {
        if (!waitingForResponse) {
            messageInput.current?.focus();
        }
    }, [waitingForResponse]);

    const sendMessage = async (innerHtml: string, textContent: string, innerText: string, nodes: NodeList) => {
        const newMessageList = [...messages];
        const newMessage: Message = {
            content: textContent,
            sentTime: Math.floor(Date.now() / 1000),
            sender: 'You',
            direction: 'outgoing',
        }
        newMessageList.push(newMessage);
        setMessages([...newMessageList]);

        setWaitingForResponse(true);
        const response = await getResponse(newMessageList);

        const newMessageResponse: Message = {
            content: response.content,
            sentTime: Math.floor(Date.now() / 1000),
            sender: CHATGPT_USER,
            direction: 'incoming',
        }

        newMessageList.push(newMessageResponse);
        setMessages([...newMessageList]);
        setWaitingForResponse(false);
    }

    const getResponse = async (newMessageList: Message[]) => {
        const systemMessage = {
            role: ChatCompletionRequestMessageRoleEnum.System,
            content: behavior,
        }

        const input = newMessageList.map((message) => {
            return {
                role: message.sender === CHATGPT_USER ? ChatCompletionRequestMessageRoleEnum.Assistant : ChatCompletionRequestMessageRoleEnum.User,
                content: message.content,
            }
        });

        const response = await OPENAI_CLIENT.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [systemMessage, ...input],
        });
        console.log(response);

        return {
            content: response.data.choices[0].message?.content,
        }

        await new Promise(f => setTimeout(f, 1000));
        return {
            content: `${Math.random()}`,
        }
    }

    const updateBehavior = () => {
        const finalBehavior = behaviorInput.trim().length ? behaviorInput.trim() : DEAFULT_BEHAVIOR;
        setBehavior(finalBehavior);
    }

    return (
        <div className={styles.container}>
            <div className={styles.chatWrapper}>
                <div className={styles.chatContainer}>
                    <MainContainer className={styles.chatMainContainer}>
                        <ChatContainer>
                            <MessageList className={styles.chatMessageList}
                                typingIndicator={waitingForResponse && <TypingIndicator content="Mr. Investor is thinking" style={{ background: '#151E47' }} />}>
                                {
                                    messages.map((message) => {
                                        return (
                                            <Message
                                                model={{
                                                    message: message.content,
                                                    sentTime: `${message.sentTime}`,
                                                    sender: message.sender,
                                                    direction: message.direction,
                                                    position: 'normal',
                                                    type: 'text',
                                                }}
                                            />
                                        )
                                    })
                                }
                            </MessageList>
                            <MessageInput className={styles.chatMessageInput} placeholder="Send a message to Mr. Investor"
                                style={{ border: 'none'}}
                                onSend={sendMessage}
                                autoFocus={true}
                                attachButton={false}
                                disabled={waitingForResponse}
                                ref={messageInput}
                            />
                        </ChatContainer>
                    </MainContainer>
                </div>
            </div>
        </div>
    )
}