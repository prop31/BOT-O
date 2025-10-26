const originalRiffy = require('riffy');

// Patch resolve function
const originalResolve = originalRiffy.Riffy.prototype.resolve;

originalRiffy.Riffy.prototype.resolve = async function(options) {
    try {
        const result = await originalResolve.call(this, options);
        return result;
    } catch (error) {
        // ถ้า error เกิดจาก response.data.map
        if (error.message && error.message.includes('is not a function')) {
            console.error('Riffy resolve error - attempting manual resolution');
            
            // ลองค้นหาแบบ fallback
            try {
                const node = this.leastUsedNodes[0];
                if (!node) throw new Error('No available nodes');

                const params = new URLSearchParams();
                params.append('identifier', options.query);

                const response = await node.rest.get(`/v4/loadtracks?${params.toString()}`);
                
                // จัดการ response ให้อยู่ในรูปแบบที่ถูกต้อง
                if (response && response.data) {
                    return {
                        loadType: response.data.loadType || 'track',
                        tracks: Array.isArray(response.data.data) ? response.data.data : 
                                response.data.tracks || [],
                        playlistInfo: response.data.playlistInfo || null
                    };
                }
            } catch (fallbackError) {
                console.error('Fallback resolution failed:', fallbackError);
            }
        }
        throw error;
    }
};

module.exports = originalRiffy;
