import { ActionIcon, Avatar, createStyles, getStylesRef, Loader, MantineTheme, MediaQuery, px } from '@mantine/core'
import { IconEdit, IconRepeat, IconSettings, IconX, IconPlaylist, IconPlaylistOff} from '@tabler/icons-react'
import { Message } from '@/stores/Message'
import { useChatStore } from '@/stores/ChatStore'
import { useSpeechSynthesis } from '../lib/useSpeechSynthesis'
import { delMessage,regenerateAssistantMessage,setEditingMessage } from '@/stores/ChatActions'
import MessageDisplay from './MessageDisplay'
import UserIcon from './UserIcon'
import AssistantIcon from './AssistantIcon'

const useStyles = createStyles((theme: MantineTheme) => ({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",

    [`@media (min-width: ${theme.breakpoints.sm})`]: {
      paddingBottom: "5em",
    },
  },
  chatContainer: {
    overflowY: "scroll",
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
  },
  messageContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 0,
    paddingRight: 0,
    [`@media (min-width: ${theme.breakpoints.md})`]: {
      paddingLeft: theme.spacing.xl,
      paddingRight: theme.spacing.xl,
    },

    [`&:hover .${getStylesRef("button")}`]: {
      opacity: 1,
    },
    borderTop: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[3]
    }`,
  },
  message: {
    borderRadius: theme.radius.sm,
    paddingLeft: theme.spacing.xs,
    paddingRight: theme.spacing.xs,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    display: "inline-block",
    maxWidth: "800px",
    wordWrap: "break-word",
    fontSize: theme.fontSizes.sm,
    width: "100%",
  },
  userMessageContainer: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[8]
        : theme.colors.gray[1],
  },
  botMessageContainer: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[7]
        : theme.colors.gray[2],
  },
  userMessage: {
    // All children that are textarea should have color white
    "& textarea": {
      fontSize: "inherit",
      marginInlineStart: "0px",
      marginInlineEnd: "0px",
    },
  },
  botMessage: {},
  actionIcon: {
    ref: getStylesRef("button"),

    opacity: 0,
    transition: "opacity 0.2s ease-in-out",
  },
  textArea: {
    width: "100%",
  },
  messageDisplay: {
    marginLeft: theme.spacing.md,
  },
  actionIconsWrapper: {
    display: "flex",
    flexDirection: "column-reverse",
    alignItems: "flex-end",

    [`@media (min-width: ${theme.breakpoints.sm})`]: {
      marginTop: theme.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
    },
    "> button": {
      marginTop: theme.spacing.xs,
      [`@media (min-width: ${theme.breakpoints.sm})`]: {
        marginTop: 0,
      },
    },
    "> button:not(:first-of-type)": {
      marginTop: 0,
      [`@media (min-width: ${theme.breakpoints.sm})`]: {
        marginTop: 0,
      },
    },
  },
  messageWrapper: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  topOfMessage: {
    alignSelf: "start",
    marginTop: theme.spacing.sm,
  },
}));

export default function ChatDisplay({ message }: { message: Message }) {
  const { classes, cx } = useStyles()
  const { voices /* constant.voices*/ , speaking, highlight, cancel, speak } = useSpeechSynthesis({
    onEnd (event : SpeechSynthesisEvent) {
      console.log('this is the speech callback and we have the event; it would be interesting to see if the message.content is now longer than event.charIndex + event.charLength; if so, speaking should simply continue')
      console.log(message)
      console.log(message.loading, message.content.length, event.utterance.text.length)
      if (message.content.length > event.utterance.text.length) {
        console.log('RECYCLE------------------')
        speak({
          // this can't be the entire message, because part of the message has already been read out loud
          text: `${' '.repeat(event.utterance.text.length)}${message.content.slice(event.utterance.text.length)}`,
          // voice, and other settings should be the same as the original message
          voice: voices.find(({voiceURI}) => voiceURI === settings.voice) as SpeechSynthesisVoice || undefined,
          rate: settings.voiceRate || defaultSettings.voiceRate,
          pitch: settings.voicePitch || defaultSettings.voicePitch,
          volume: settings.voiceVolume || defaultSettings.voiceVolume,
        })
      }
    }
  })

  const settings = useChatStore((state) => state.settingsForm)
  const defaultSettings = useChatStore((state) => state.defaultSettings)

  const handleMainAction = (message: Message) => {
    if (message.role === "assistant") {
      regenerateAssistantMessage(message);
    } else {
      setEditingMessage(message);
    }
  };

  const handleDeleteMessage = (message: Message) => {
    delMessage(message)
  }

  return (
    <div key={message.id} className={ cx(classes.messageContainer, message.role === "user" ? classes.userMessageContainer : classes.botMessageContainer) }>
      <div className={ cx(classes.message, message.role === "user" ? classes.userMessage : classes.botMessage) }>
        <div className={ classes.messageWrapper }>
          <div style={ {display: "flex", alignItems: "center"} }>
            <MediaQuery smallerThan="md" styles={ { display: "none" } }>
              <div className={ classes.topOfMessage }>
                <Avatar size="sm">
                  { message.role === "system" ? (<IconSettings />) : message.role === "assistant" ? (message.loading ? <Loader color="orange" /> : <AssistantIcon width={px("1.5rem")} height={px("1.5rem")} />) : (<UserIcon width={px("1.5rem")} height={px("1.5rem")} />) }
                </Avatar>
              </div>
            </MediaQuery>

            <MessageDisplay message={message} highlight={highlight} className={classes.messageDisplay} />
          </div>
          <div className={ classes.actionIconsWrapper }>
            <ActionIcon className={ cx(classes.actionIcon, classes.topOfMessage) } onClick={ () => handleMainAction(message) } color="gray">
              {message.role === "assistant" ? <IconRepeat /> : <IconEdit />}
            </ActionIcon>
            <ActionIcon className={ cx(classes.actionIcon, classes.topOfMessage) } onClick={ () => { handleDeleteMessage(message); cancel() }} color="gray">
              <IconX />
            </ActionIcon>
            <Reader>
              <ActionIcon variant='filled' color={speaking ? 'red' : 'blue'} className={ cx(classes.actionIcon, classes.topOfMessage) } onClick={
                () => speaking
                  ? cancel()
                  : speak({
                    text: message.content,
                    voice: voices.find(({voiceURI}) => voiceURI === settings.voice) as SpeechSynthesisVoice || undefined,
                    rate: settings.voiceRate || defaultSettings.voiceRate,
                    pitch: settings.voicePitch || defaultSettings.voicePitch,
                    volume: settings.voiceVolume || defaultSettings.voiceVolume,
                  })
              }>
                {speaking ? <IconPlaylistOff size={px("1.1rem")} stroke={3} /> : <IconPlaylist size={px("1.1rem")} stroke={3} />}
              </ActionIcon>
            </Reader>
          </div>
        </div>
      </div>
    </div>
  )
}

// !!! fixme: Reader will be the player for the text to voice service and highlight while reading
export const Reader = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {children}
    </div>
  )
}

function useRef(arg0: { loading: boolean | undefined; }) {
  throw new Error("Function not implemented.");
}

