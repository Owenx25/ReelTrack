"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = __importDefault(require("discord.js"));
class MockDiscord {
    constructor() {
        this.mockClient();
        this.mockGuild();
        this.mockChannel();
        this.mockGuildChannel();
        this.mockTextChannel();
        this.mockUser();
        this.mockGuildMember();
        this.guild.addMember(this.guildMember, { accessToken: 'mocktoken' });
        this.mockMessage();
        this.mockMessageReaction();
    }
    getClient() {
        return this.client;
    }
    getGuild() {
        return this.guild;
    }
    getChannel() {
        return this.channel;
    }
    getGuildChannel() {
        return this.guildChannel;
    }
    getTextChannel() {
        return this.textChannel;
    }
    getUser() {
        return this.user;
    }
    getGuildMember() {
        return this.guildMember;
    }
    getMessage() {
        return this.message;
    }
    getMessageReaction() {
        return this.messageReaction;
    }
    mockClient() {
        this.client = new discord_js_1.default.Client();
        this.client.login(process.env.TOKEN);
    }
    mockGuild() {
        this.guild = new discord_js_1.default.Guild(this.client, {
            unavailable: false,
            id: 'guild-id',
            name: 'mocked discord.js guild',
            icon: 'mocked guild icon url',
            splash: 'mocked guild splash url',
            region: 'eu-west',
            member_count: 42,
            large: false,
            features: [],
            application_id: 'application-id',
            afkTimeout: 1000,
            afk_channel_id: 'afk-channel-id',
            system_channel_id: 'system-channel-id',
            embed_enabled: true,
            verification_level: 2,
            explicit_content_filter: 3,
            mfa_level: 8,
            joined_at: new Date('2018-01-01').getTime(),
            owner_id: 'owner-id',
            channels: [],
            roles: [],
            presences: [],
            voice_states: [],
            emojis: [],
        });
    }
    mockChannel() {
        this.channel = new discord_js_1.default.Channel(this.client, {
            id: 'channel-id',
        });
    }
    mockGuildChannel() {
        this.guildChannel = new discord_js_1.default.GuildChannel(this.guild, Object.assign(Object.assign({}, this.channel), { name: 'guild-channel', position: 1, parent_id: '123456789', permission_overwrites: [] }));
    }
    mockTextChannel() {
        this.textChannel = new discord_js_1.default.TextChannel(this.guild, Object.assign(Object.assign({}, this.guildChannel), { topic: 'topic', nsfw: false, last_message_id: '123456789', lastPinTimestamp: new Date('2019-01-01').getTime(), rate_limit_per_user: 0 }));
    }
    mockUser() {
        this.user = new discord_js_1.default.User(this.client, {
            id: 'user-id',
            username: 'user username',
            discriminator: 'user#0000',
            avatar: 'user avatar url',
            bot: false,
        });
    }
    mockGuildMember() {
        this.guildMember = new discord_js_1.default.GuildMember(this.client, {
            deaf: false,
            mute: false,
            self_mute: false,
            self_deaf: false,
            session_id: 'session-id',
            channel_id: 'channel-id',
            nick: 'nick',
            joined_at: new Date('2020-01-01').getTime(),
            user: this.user,
            roles: [],
            id: 'id'
        }, this.guild);
    }
    mockMessage() {
        this.message = new discord_js_1.default.Message(this.client, {
            id: 'message-id',
            type: 'DEFAULT',
            content: 'this is the message content',
            author: this.user,
            webhook_id: null,
            member: this.guildMember,
            pinned: false,
            tts: false,
            nonce: 'nonce',
            embeds: [],
            attachments: [],
            edited_timestamp: null,
            reactions: [],
            mentions: [],
            mention_roles: [],
            mention_everyone: [],
            hit: false
        }, this.textChannel);
    }
    mockMessageReaction() {
        const mockEmoji = new discord_js_1.default.Emoji(this.client, {
            animated: false,
            name: 'mockEmoji',
            id: '0'
        });
        this.messageReaction = new discord_js_1.default.MessageReaction(this.client, {
            emoji: [mockEmoji]
        }, this.message);
    }
}
exports.default = MockDiscord;
//# sourceMappingURL=mockDiscord.js.map