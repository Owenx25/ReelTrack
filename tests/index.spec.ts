import fetchMock from "jest-fetch-mock"
import movieData from './mockMovieData.json';
import * as index from '../src/index';
import { MovieResponse } from "../src/MovieResponse";
//import * as Discord from 'discord.js';
//import MockDisord from './mockDiscord';

jest.mock('mongodb');
jest.mock('discord.js');

describe('index methods', () => {
  let url = '';
  beforeEach(() => {
    fetchMock.resetMocks()
    url = `http://www.omdbapi.com/?apikey=${process.env.OMDB_KEY}`;
  })

  describe('fetchMovieData method', () => {
  it('should fetch movie with title and year', async () => {
      const title: string = "Suspiria";
      const year: string = "1977";

      fetchMock.mockResponseOnce(JSON.stringify(movieData));
      
      const response = await index.fetchMovieData(title, year)

      expect(response).toEqual(movieData);
      expect(fetchMock.mock.calls.length).toEqual(1);
      expect(fetchMock.mock.calls[0][0]).toEqual(url + `&t=${title}&y=${year}`);
    });

    it('should throw format error if title not provided', async () => {
      const title = undefined;
      const year = '1977';

      try {
        const actual = await index.fetchMovieData(title, year);
      } catch(err) {
        expect(err).toEqual("No title provided.");
      }    
    });

    // Year will be undefiened if invalid
  it('should not include year in fetch if empty', async () => {
      const title: string = "Suspiria";
      const year: string = undefined;

      fetchMock.mockResponseOnce(JSON.stringify(movieData));
      
      const response = await index.fetchMovieData(title, year)

      expect(response).toEqual(movieData);
      expect(fetchMock.mock.calls.length).toEqual(1);
      expect(fetchMock.mock.calls[0][0]).toEqual(url + `&t=${title}`);
    });

  it('should throw error if fetch fails', async () => {
      const title: string = "Suspiria";
      const year: string = "abc";
      const err: Error = new Error('OMDB API call failed')

      fetchMock.mockRejectOnce(err);
      try {
        await index.fetchMovieData(title, year);
      } catch (err) {
        expect(err).toEqual(err);
      }
    });

    it('should return OMDB API error if response was bad', async () => {
      const badResponse: MovieResponse = { ...movieData };
      badResponse.Response = "False";
      badResponse.Error = "Movie not found!";
      fetchMock.mockResponseOnce(JSON.stringify(badResponse));

      const title = 'Suspiria';
      const year = '1977';

      try {
        await index.fetchMovieData(title, year);
      } catch (err) {
        expect(err).toEqual("Movie not found!");
      }
    });
  });

  describe('processLookupCommand method', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

  it('should return MovieResponse if API call was successful', async () => {
      const fetchMovieData = jest.spyOn(index, 'fetchMovieData').mockResolvedValue(movieData);
      const title = 'Suspiria';
      const year = '1977';

      const actual = await index.processLookupCommand(title, year);

      expect(fetchMovieData).toBeCalled();
      expect(fetchMovieData.mock.calls[0][0]).toBe(title);
      expect(fetchMovieData.mock.calls[0][1]).toBe(year); 
      expect(actual).toBe(movieData);
    })
  });

  describe('parseCommand method', () => {
  it('should ignore commands that don\'t start with the prefix(::)', () => {
      const message = ";;lookup 1917";
      const actual = index.parseCommand(message);
      expect(actual).toBeUndefined();
    });

    describe('lookup command', () => {
    it('should parse with title only', () => {
        const message = "::lookup 1917";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['lookup', '1917', undefined]);
      });

    it('should parse with title and date', () => {
        const message = "::lookup Suspiria, 1977";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['lookup', 'Suspiria', '1977']);
      });

    it('should parse with spaced title', () => {
        const message = "::lookup Blade Runner";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['lookup', 'Blade Runner', undefined]);
      });

    it('should parse with spaced title and date', () => {
        const message = "::lookup Blade Runner, 1982";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['lookup', 'Blade Runner', '1982']);
      });

      it('should ignore bad input', () => {
        const message = "::lookup *&*%^%$&%% %#^#$^";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['lookup', undefined, undefined]);
      });
    });

    describe('add command', () => {
      it('should parse with title', () => {
        const message = "::add Blade";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['add', 'Blade', undefined]);
      });

      it('should parse with spaced title', () => {
        const message = "::add Blade Runner";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['add', 'Blade Runner', undefined]);
      });

      it('should parse with title and date', () => {
        const message = "::add Suspiria, 1977";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['add', 'Suspiria', '1977']);
      });

      it('should parse with spaced title and date', () => {
        const message = "::add Blade Runner, 2017";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['add', 'Blade Runner', '2017']);
      });

      it('should ignore bad input', () => {
        const message = "::add *&*%^%$&%% %#^#$^";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['add', undefined, undefined]);
      });
    });

    describe('watched command', () => {
      it('should parse with title', () => {
        const message = "::watched Blade";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['watched', 'Blade', undefined]);
      });

      it('should parse with spaced title', () => {
        const message = "::watched Blade Runner";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['watched', 'Blade Runner', undefined]);
      });

      it('should parse with title and date', () => {
        const message = "::watched Suspiria, 1977";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['watched', 'Suspiria', '1977']);
      });

      it('should parse with spaced title and date', () => {
        const message = "::watched Blade Runner, 2017";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['watched', 'Blade Runner', '2017']);
      });

      it('should ignore bad input', () => {
        const message = "::watched *&*%^%$&%% %#^#$^";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['watched', undefined, undefined]);
      });
    });

    describe('list command', () => {
      it('should parse vanilla command with no args', () => {
        const message = "::list";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['list', undefined, undefined]);
      });

      it('should parse vanilla command with number arg', () => {
        const message = "::list 10";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['list', '10', undefined]);
      });

      it('should parse vanilla command with number arg', () => {
        const message = "::list 10";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['list', '10', undefined]);
      });

      it('should parse vanilla command with title arg', () => {
        const message = "::list Blade";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['list', 'Blade', undefined]);
      });

      it('should parse unwatched subcommand with no arg', () => {
        const message = "::list unwatched";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['list', 'unwatched', undefined]);
      });

      // it('should parse unwatched subcommand with number arg', () => {
      //   const message = "::list unwatched 50";
      //   const actual = index.parseCommand(message);
      //   expect(actual).toEqual(['list', 'unwatched 50', undefined]);
      // });

      it('should parse unwatched subcommand with user arg', () => {
        const message = "::list unwatched Owen";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['list', 'unwatched Owen', undefined]);
      });

      it('should parse unwatched subcommand with user args', () => {
        const message = "::list unwatched Owen, Garrison, Wilson";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['list', 'unwatched Owen', 'Garrison, Wilson']);
      });

      // it('should parse unwatched subcommand with all args', () => {
      //   const message = "::list unwatched 50 Owen";
      //   const actual = index.parseCommand(message);
      //   expect(actual).toEqual(['list', 'unwatched 50 Owen', undefined]);
      // });

      it('should parse genre subcommand with genre arg', () => {
        const message = "::list genre horror";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['list', 'genre horror', undefined]);
      });

      it('should parse genre subcommand with genre and number arg', () => {
        const message = "::list genre horror 10";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['list', 'genre horror 10', undefined]);
      });

      it('should parse director subcommand with director arg', () => {
        const message = "::list director Ridely Scott";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['list', 'director Ridely Scott', undefined]);
      });

      it('should parse director subcommand with director and number arg', () => {
        const message = "::list director Ridely Scott 3";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['list', 'director Ridely Scott 3', undefined]);
      });

      it('should parse year subcommand with year arg', () => {
        const message = "::list year 2000";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['list', 'year 2000', undefined]);
      });

      it('should parse year subcommand with year and number arg', () => {
        const message = "::list year 2000 5";
        const actual = index.parseCommand(message);
        expect(actual).toEqual(['list', 'year 2000 5', undefined]);
      });
    });
    
    // --> Skipping discord js unit testing until I can figure out mocking
    // describe('add command', () => {
    //   const mockDiscord = new MockDisord();

    //   beforeEach(() => {
    //     jest.resetAllMocks();
    //   });

    //   afterAll(() => {
    //     mockDiscord.getClient().destroy();
    //   })

    //   it('should return success message if no exceptions were thrown', async () => {
    //     const fetchMovieData = jest.spyOn(index, 'fetchMovieData').mockResolvedValue(movieData);
    //     const title = 'Blade Runner';
    //     const year = '1982';
    //     const mockMessage = mockDiscord.getMessage();

    //     const reaction: readonly [string, Discord.MessageReaction][] = [['snowflake', mockDiscord.getMessageReaction()]];

    //     //jest.fn(mockMessage.channel.send).mockResolvedValue(mockMessage);
    //     jest.fn(mockMessage.awaitReactions).mockResolvedValue(new Discord.Collection(reaction));
    //     const test = mockMessage;
        

    //     index.processAddCommand(title, year, mockMessage);
    //   });
    // });
  });
});
