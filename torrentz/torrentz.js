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

    settings.createMultiOpt('sorting', "Sort results by", [
        ['search', 'Peers', true],
        ['searchA', 'Date'],
        ['searchN', 'Rating'],
        ['searchS', 'Size']
        ], function(v) {
            service.sorting = v;
    	}
    );
    
    settings.createMultiOpt('torrentDownloadUrl', "Get torrent files from", [
        ['magnet', 'Magnet links', true],
        ['torcache', 'Torcache.net']
        ], function(v) {
        	switch (v) {
        		case 'magnet':
        			service.urlPrefix = "magnet:?xt=urn:btih:";
        			service.urlSuffix = "&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=http%3A%2F%2Ftracker.trackerfix.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker4.piratux.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.blackunicorn.xyz%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce&tr=http%3A%2F%2Ftracker.aletorrenty.pl%3A2710%2Fannounce&tr=udp%3A%2F%2Ftracker.pomf.se%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2F9.rarbg.me%3A2710%2Fannounce&tr=http%3A%2F%2Ftorrent.gresille.org%2Fannounce&tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&tr=udp%3A%2F%2Feddie4.nl%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&tr=http%3A%2F%2Ftracker.pubt.net%3A2710%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Ftracker.istole.it%3A80&tr=udp%3A%2F%2Ftracker.publicbt.com%3A80&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=http%3A%2F%2Ftracker.yify-torrents.com%2Fannounce";
        		break;
        		case 'torcache':
        			service.urlPrefix = "torrent:browse:http://torcache.net/torrent/";
        			service.urlSuffix = ".torrent";
        		break;
        	}
    	}
    );
    
    settings.createMultiOpt('torrentzUrl', "Use this torrentz.eu mirror:", [
        ['https://torrentz.eu', 'https://torrentz.eu', true],
        ['https://torrentz.com', 'https://torrentz.com'],
        ['https://torrentz.ph', 'https://torrentz.ph'],
        ['https://torrentz.li', 'https://torrentz.li'],
        ['https://torrentz.me', 'https://torrentz.me'],
        ['https://torrentz.in', 'https://torrentz.in'],
        ['https://torrentz.hk', 'https://torrentz.hk'],
        ['https://torrentz.de', 'https://torrentz.de'],
        ['https://tz.ai', 'https://tz.ai'],
        ['https://torrentz-proxy.com', 'https://torrentz-proxy.com']
        ], function(v) {
            service.torrentzUrl = v;
    	}
    );

	function d(c) {
		print(JSON.stringify(c, null, 4));
	}
	
	function generateStatusText(sizeT) {
		var size = sizeT.split(' ');
        var sizeText = sizeT;
		if (size[1] == 'MB') {	//only MB and GB available
			if (size[0] > 2048) {
				sizeText = colorStr('It is almost IMPOSSIBLE to watch this movie in streaming mode\n(avg. dur. 120min = 7200seconds; '+size[0]+size[1]+' / 7200s = '+(Math.round((size[0]/7200) * 1000) / 1000)+size[1]+'/s constantly ! )', red);
			} else if ((size[0] < 2048) && (size[0] > 1024)) {
				sizeText = colorStr('There might be some buffering time - better have faster internet connection', yellow);
			} else {
				sizeText = colorStr('The movie should work OK on standatr internet connection', green);
			}
		} else {
			sizeText = colorStr('The movie should work OK on standatr internet connection', green);
		}
		return sizeText;
	}
	
	function getIMDBinfo(title) {
		return showtime.JSONDecode(showtime.httpReq("http://www.imdb.com/xml/find?json=1&nr=1&tt=on&q=" + encodeURIComponent(showtime.entityDecode(unescape(title))).toString()));
	}
	
	function isIrrelevantWord(word) {
		//TODO
	}
	
	function getOnlyMovieTitle(title) {
		var c = title.split(" ");
		var t = "";
		for (var i = 0; i < c.length; i++) {
			if (isIrrelevantWord(c[i])) {
				break;
			}
			t += c[i] + " ";
		}
		return t;
	}

    function browseItems(page, search) {
        var pageNumber = 0;
        page.entries = 0;

        //1 - btih, 2 - name, 3 - verified, 4 - add-date, 5 - old, 6 - size, 7 - seeds, 8 - peers
        var pattern = /<dl><dt><a href="\/(\S+?)">(.*?)<\/a> &#187;.*?<\/dt><dd><span class="v" .*?>(\d+?)<\/span><span class="a"><span title="(.*?)">(.*?)<\/span><\/span><span class="s">(.*?)<\/span>.*?<span class="u">(.*?)<\/span><span class="d">(.*?)<\/span><\/dd><\/dl>/igm;

        //number of pages
        var pagesPattern = />(\d+)<\/a>\s*?<a href="\/\S*?">Next &raquo;<\/a>/im;
        var maxPages = null;
        
        function loader() {
            page.loading = true;
            
            var url = service.torrentzUrl + '/'+service.sorting+'?p='+pageNumber+'&f='+ (search ? search.replace(/\s/g, '+') : '');
            d(url);
            var c = showtime.httpReq(url);

            var match = null;
            if (maxPages == null) {
            	match = pagesPattern.exec(c);
            	if (match != null) {
            		maxPages = match[1];
            	} else {
            		maxPages = 1;
            	}
            	d(maxPages);
            }
            
            while ((match = pattern.exec(c)) !== null) {
            	
            	//var imdb = getIMDBinfo(getOnlyMovieTitle(match[2]));
            	
            	var statusText = generateStatusText(match[6]);
            	
                var item = page.appendItem(service.urlPrefix + match[1] + service.urlSuffix, 'video', {
	                title: new showtime.RichText(match[2]),
	                description: new showtime.RichText(
	                	colorStr('Seeds: ', orange) + colorStr(match[7], green) +
	                	colorStr(' Peers: ', orange) + colorStr(match[8], red) +
	                	colorStr('\nSize: ', orange) + match[6] +
	                	colorStr(' Verified by: ', orange) + match[3] + ' people' +
	                	colorStr('\nDate Uploaded: ', orange) + match[4] +
	                	colorStr(' ('+match[5]+' ago)', blue) +
	                	colorStr('\nStatus: ', orange) + statusText
	                )
                });
                page.entries++;	//for searcher to work
                
            }
            
            page.loading = false;
            if (pageNumber == 0 && page.metadata) {	//only for first page - search results
               page.metadata.title += ' (' + page.entries + ')';
            }

            pageNumber++;
            return pageNumber < maxPages;	//max pages for torrentz.eu
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
