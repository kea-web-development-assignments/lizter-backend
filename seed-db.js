import UserModel from './models/User.js';
import ItemModel from './models/Item.js';
import ItemTypeModel from './models/ItemType.js';
import TagModel from './models/Tag.js';

export default async function (mongooseConnection) {
    const User = UserModel(mongooseConnection);
    const Item = ItemModel(mongooseConnection);
    const ItemType = ItemTypeModel(mongooseConnection);
    const Tag = TagModel(mongooseConnection);

    // Seed data if there is none yet

    if(!(await User.countDocuments())) {
        await User.create([
            {
                username: 'aaa',
                firstName: 'aaa',
                lastName: 'bbb',
                email: 'aaa@aaa.aaa',
                password: '0w4Zkz5A2@zdv0z@!PZb',
                role: 'user',
                verified: true,
            },
            {
                username: 'admin',
                firstName: 'admin',
                lastName: 'admin',
                email: 'admin@admin.admin',
                password: 'c$g6uFuN6MH&NR5ctB$X',
                role: 'admin',
                verified: true,
            },
        ]);
    }

    if(!(await Tag.countDocuments())) {
        await Tag.create([
            { name: 'Action' },
            { name: 'Comedy' },
            { name: 'Drama' },
            { name: 'Sci-Fi' },
            { name: 'Horror' },
            { name: 'Thriller' },
            { name: 'Adventure' },
            { name: 'RPG' },
            { name: 'Strategy' },
            { name: 'Survival Horror' },
            { name: 'Fantasy' },
            { name: 'Romance' },
            { name: 'Mystery' },
            { name: 'Shonen' },
            { name: 'Survival' },
            { name: 'Slice of Life' },
            { name: 'OVA' },
        ]);
    }

    if(!(await ItemType.countDocuments())) {
        await ItemType.create([
            { name: 'movie' },
            { name: 'series' },
            { name: 'game' },
            { name: 'book' },
            { name: 'anime' },
            { name: 'other' },
        ]);
    }

    if(!(await Item.countDocuments())) {
        await Item.create([
            {
                type: 'movie',
                name: 'Dune: Part Two',
                slug: 'dune-part-two',
                description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he must prevent a terrible future only he can foresee.',
                releaseDate: new Date('2024-03-01'),
                cover: 'https://t2.gstatic.com/licensed-image?q=tbn:ANd9GcTnUxId4K1OxO0LnxnTGUKksuy3j3k-4DcLgcC5qZ-lyKlu9QxZI5CO1OaTsb0-493ymtiHsSTL0464bL-o',
                tags: [ 'Action', 'Drama', 'Sci-Fi' ],
                meta: {
                    directors: [ 'Denis Villeneuve' ],
                    cast: [ 'Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson' ],
                },
            },
            {
                type: 'series',
                name: 'The Expanse',
                slug: 'the-expanse',
                description: 'Hundreds of years in the future, things are different than what humanity is used to after humans have colonized the solar system and Mars has become an independent military power. Rising tensions between Earth and Mars have put them on the brink of war. Against this backdrop, a hardened detective and a rogue ship\'s captain come together to investigate the case of a missing young woman. The investigation leads them on a race across the solar system that could expose the greatest conspiracy in human history.',
                releaseDate: new Date('2015-11-23'),
                cover: 'https://m.media-amazon.com/images/S/pv-target-images/1766a1cc94bcd6c04a9cd449e5c2f2f0bdb4fbf9525832ea2c9c170c48ad433e.jpg',
                images: [
                    'https://www.syfy.com/sites/syfy/files/2017/02/theexpanse_gallery_206recap_14.jpg',
                    'https://static.wikia.nocookie.net/expanse/images/4/4a/205.jpg/revision/latest?cb=20170216135656',
                    'https://www.indiewire.com/wp-content/uploads/2017/01/nup_173639_0318.jpg?w=780',
                    'https://metadata-static.plex.tv/extras/iva/558475/df063c807721a98f7537d301d7935bb8.jpg',
                ],
                tags: [ 'Sci-Fi', 'Drama', 'Mystery' ],
                meta: {
                    creators: [ 'Daniel Abraham', 'Mark Fergus', 'Ty Franck' ],
                    cast: [ 'Steven Strait', 'Dominique Tipper', 'Wes Chatham' ],
                },
            },
            {
                type: 'game',
                name: 'Bloodborne',
                slug: 'bloodborne',
                description: 'Bloodborne is a 2015 action role-playing game developed by FromSoftware and published by Sony Computer Entertainment for the PlayStation 4. The game follows a Hunter through the decrepit Gothic, Victorian-era in Europe inspired city of Yharnam, whose inhabitants are afflicted with a blood-borne disease which transforms the residents into horrific beasts. Attempting to find the source of the plague, the player\'s character unravels the city\'s mysteries while fighting a variety of enemies.',
                releaseDate: new Date('2015-03-24'),
                cover: 'https://image.api.playstation.com/vulcan/img/rnd/202010/2614/NVmnBXze9ElHzU6SmykrJLIV.png',
                images: [
                    'https://www.rpgfan.com/wp-content/uploads/2020/04/Bloodborne-ss-087.jpg',
                    'https://platform.polygon.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/2846886/14206641937_9baf8e76b0_o.1402449145.jpg?quality=90&strip=all',
                    'https://www.rpgfan.com/wp-content/uploads/2020/04/Bloodborne-ss-086.jpg',
                    'https://sm.ign.com/ign_ap/news/b/bloodbornes-chalice-dungeons-get-new-screenshots/bloodbornes-chalice-dungeons-get-new-screenshots_zvhu.jpg',
                ],
                tags: [ 'Action', 'RPG', 'Survival Horror' ],
                meta: {
                    directors: [ 'Hidetaka Miyazaki' ],
                    writers: [ 'Hidetaka Miyazaki' ],
                    platforms: [ 'PS4', 'PS5' ],
                },
            },
            {
                type: 'book',
                name: 'The Fellowship of the Ring',
                slug: 'the-fellowship-of-the-ring',
                description: 'When the eccentric hobbit Bilbo Baggins leaves his home in the Shire, he gives his greatest treasure to his heir Frodo: a magic ring that makes its wearer invisible. Because of the difficulty Bilbo has in giving the ring away, his friend the wizard Gandalf the Grey suspects that the ring is more than it appears. Some years later, Gandalf reveals to Frodo that the ring is in fact the One Ring, forged by Sauron the Dark Lord thousands of years before to enable him to dominate and enslave all of Middle-earth. Gandalf tells Frodo that the Ring must be destroyed to defeat Sauron\'s evil, but he also warns him that the Enemy has learned of the Ring\'s whereabouts from the creature Gollum and will seek to find it and kill its bearer. Despite the danger and hopelessness of the quest, Frodo accepts the burden and resolves to take the Ring to the safety of the elven stronghold of Rivendell.',
                releaseDate: new Date('1954-07-29'),
                cover: 'https://imgcdn.saxo.com/_9780008567125',
                tags: [ 'Fantasy', 'Adventure' ],
                meta: {
                    authors: [ 'J.R.R. Tolkien' ],
                },
            },
            {
                type: 'anime',
                name: 'Attack on Titan',
                slug: 'attack-on-titan',
                description: 'Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called Titans, forcing humans to hide in fear behind enormous concentric walls. What makes these giants truly terrifying is that their taste for human flesh is not born out of hunger but what appears to be out of pleasure. To ensure their survival, the remnants of humanity began living within defensive barriers, resulting in one hundred years without a single titan encounter. However, that fragile calm is soon shattered when a colossal Titan manages to breach the supposedly impregnable outer wall, reigniting the fight for survival against the man-eating abominations.',
                releaseDate: new Date('2013-04-07'),
                cover: 'https://m.media-amazon.com/images/M/MV5BZjliODY5MzQtMmViZC00MTZmLWFhMWMtMjMwM2I3OGY1MTRiXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
                tags: [ 'Shonen', 'Action', 'Survival', 'Thriller' ],
                meta: {
                    studios: [ 'Wit Studio' ],
                    source: 'manga',
                },
            },
        ]);
    }
}
