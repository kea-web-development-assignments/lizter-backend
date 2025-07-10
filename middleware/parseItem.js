export default function() {
    return (req, res, next) => {
        const data = req.body;

        try {
            if(data.releaseDate) {
                data.releaseDate = isNaN(Date.parse(data.releaseDate)) ? NaN : new Date(data.releaseDate);
            }
            else if(typeof data.releaseDate === 'string') {
                data.releaseDate = undefined;
            }

            if(req.files?.cover?.length) {
                data.cover = req.files.cover[0];
            }
            if(req.files?.['images[]']?.length) {
                data.images = req.files['images[]'];
            }
        }
        catch(error) {
            console.error('Failed to parse item:', error);

            return res.status(400).send({
                error: { message: 'Failed to parse item' },
            });
        }

        next();
    };
}
