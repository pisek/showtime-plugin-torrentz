/**
 *  torrentz plugin for Movian
 *
 *  Copyright (C) 2015 Pisek
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 *  
 */


(function(plugin) {
    var PREFIX = 'torrentz';
    var logo = plugin.path + "logo.png";
    
    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45', yellow = 'FFFF00';

    function colorStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
        page.loading = true;
    }

    var service = plugin.createService(plugin.getDescriptor().id, PREFIX + ":start", "video", true, logo);

    var settings = plugin.createSettings(plugin.getDescriptor().id, logo, plugin.getDescriptor().synopsis);

	/*settings.createMultiOpt('torrentCacheUrl', "Which torrent cache system to use:", [
        [{prefix: 'http://torcache.net/torrent/', suffix: '.torrent'}, 'torcache.net', true],
        ], function(v) {
            service.torrentCacheUrl = v;
    	}
    );*/

    settings.createMultiOpt('sorting', "Sort results by", [
        ['search', 'Peers', true],
        ['searchA', 'Date'],
        ['searchN', 'Rating'],
        ['searchS', 'Size']
        ], function(v) {
            service.sorting = v;
    	}
    );

	function d(c) {
		print(JSON.stringify(c, null, 4));
	}
	
	function parseSizeText(sizeT) {
		var size = sizeT.split(' ');
        var sizeText = sizeT;
		if (size[1] == 'MB') {	//only MB and GB available
			if (size[0] > 2048) {
				sizeText = colorStr(sizeT, red);
			} else if ((size[0] < 2048) && (size[0] > 1024)) {
				sizeText = colorStr(sizeT, yellow);
			} else {
				sizeText = colorStr(sizeT, green);
			}
		} else {
			sizeText = colorStr(sizeT, red);
		}
		return sizeText;
	}

    function browseItems(page, search) {
        var offset = 0;
        page.entries = 0;
        
        function loader() {
            page.loading = true;
            
            var url = 'https://torrentz.eu/'+service.sorting+'?p='+offset+'&f='+ (search ? search : '');
            var c = showtime.httpReq(url);
            
            //1 - btih, 2 - name, 3 - verified, 4 - add-date, 5 - old, 6 - size, 7 - seeds, 8 - peers
            var pattern = /<dl><dt><a href="\/(.*?)">(.*?)<\/a> &#187;.*?<\/dt><dd><span class="v" .*?>(\d+?)<\/span><span class="a"><span title="(.*?)">(.*?)<\/span><\/span><span class="s">(.*?)<\/span>.*?<span class="u">(.*?)<\/span><span class="d">(.*?)<\/span><\/dd><\/dl>/igm;

            var match = pattern.exec(c);
            while ((match = pattern.exec(c)) !== null) {
            	
            	var sizeText = parseSizeText(match[6]);
            	
            	//'magnet:?xt=urn:btih:'+match[1]
                page.appendItem('torrent:browse:http://torcache.net/torrent/'+match[1]+'.torrent', 'video', {
	                title: new showtime.RichText(match[2]),
	                description: new showtime.RichText(
	                	colorStr('Seeds: ', orange) + colorStr(match[7], green) +
	                	colorStr(' Peers: ', orange) + colorStr(match[8], red) +
	                	colorStr(' Verified: ', orange) + match[3] +
	                	colorStr('\nDate Uploaded: ', orange) + match[4] +
	                	colorStr(' ('+match[5]+')', blue) +
	                	colorStr('\nSize: ', orange) + sizeText
	                )
                });
                
            }
            
            page.loading = false;

            offset++;
            return offset > 200;//max pages for torrentz.eu
        }
        loader();
        page.paginator = loader;
        page.loading = false;
    }

    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().synopsis);
        
        page.appendItem("", "separator", {
            title: 'All'
        });
        browseItems(page);

        page.loading = false;
    });

    plugin.addSearcher(plugin.getDescriptor().id, logo, function(page, search) {
        browseItems(page, search);
    });
})(this);
